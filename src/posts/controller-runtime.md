---
title: controller-runtime 介绍
layout: tech-post.njk
date: 2020-08-20
tags:
- post
- Go
- Kubernetes
- controller-runtime
---

[[toc]]

## 概述

[controller-runtime](https://github.com/kubernetes-sigs/controller-runtime) 是 [Kubebuilder](https://github.com/kubernetes-sigs/kubebuilder) 的子项目，提供了一系列用于构建 controller 的库；Kubebuilder 本身也是生成了大量的使用 controller-runtime 的模板代码。controller-runtime 中的几个基本概念：

- Controller：字面意思，一个 controller。
- Reconciler：提供 `Reconcile` 函数，`Controller` 的主要部分和入口函数，包含这个 controller 的所有业务逻辑（等同于普通 controller 中的 `syncHandler` 函数），用于使我们关注的 object 的实际状态逐渐向期望状态逼近。`Reconciler` 还有以下特点：
  - 通常只针对一种类型的 object，不同类型的 object 使用单独的 controller。
  - 通常不关心触发 `Reconcile` 函数的事件内容和类型；比如不管 `ReplicaSet` 是创建还是更新，`ReplicaSet` `Reconciler` 总是将集群中 `Pod` 的数量与 object 中设定的数量进行比较，再做出相应的操作。
- Builder：基于一些配置，为 `Reconciler` 生成 `Controller`。
- Manager：管理和启动 `Controller`，一个 `Manager` 可包含多个 `Controller`。

## 使用

下面以官方的一个[简单例子](https://pkg.go.dev/sigs.k8s.io/controller-runtime/pkg/builder#example-Builder)来分步介绍怎么使用 controller-runtime 构建一个 controller：首先定义 `Reconciler`，其中包含 controller 的主要逻辑，然后使用 `Builder` 生成 `Controller` 并加入到 `Manager` 中，最后启动 `Manager`。

*注：以 v0.5.0 版本为例，最新版 Reconcile 函数定义有变化*

每一步的详细介绍如下：

### Reconciler

#### 介绍

`Reconciler` 的定义如下，仅包含一个 `Reconcile` 函数：

```go
type Reconciler interface {
	// Reconciler performs a full reconciliation for the object referred to by the Request.
	// The Controller will requeue the Request to be processed again if an error is non-nil or
	// Result.Requeue is true, otherwise upon completion it will remove the work from the queue.
	Reconcile(Request) (Result, error)
}
```

`Request` 和 `Result` 定义如下：

```go
// Request contains the information necessary to reconcile a Kubernetes object.  This includes the
// information to uniquely identify the object - its Name and Namespace.  It does NOT contain information about
// any specific Event or the object contents itself.
type Request struct {
	// NamespacedName is the name and namespace of the object to reconcile.
	types.NamespacedName
}

// Result contains the result of a Reconciler invocation.
type Result struct {
	// Requeue tells the Controller to requeue the reconcile key.  Defaults to false.
	Requeue bool

	// RequeueAfter if greater than 0, tells the Controller to requeue the reconcile key after the Duration.
	// Implies that Requeue is true, there is no need to set Requeue to true at the same time as RequeueAfter.
	RequeueAfter time.Duration
}
```

`Request` 包含本次 reconcile object 的 namespace 和 name，object 类型是生成 controller 时配置的，一个 `Reconciler` 仅能处理一种类型的 object；`Result` 基本不用关心，如果 `Reconcile` 返回 error 会自动 requeue。

#### 使用示例

定义一个 `ReplicaSetReconciler`，其中包含一个由 controller-runtime 提供的一个 [generic client](https://github.com/kubernetes-sigs/controller-runtime/tree/master/pkg/client)，功能同普通的 kubernetes client，能获取到集群的所有资源：

```go
// ReplicaSetReconciler is a simple ControllerManagedBy example implementation.
type ReplicaSetReconciler struct {
	client.Client
}
```

不过和普通 kubernetes client 不同的是，这个通用 client 是一个 client 就能 CRUD 所有类型的资源，非常方便和易于使用。

然后是实现业务逻辑：

```go
// Implement the business logic:
// This function will be called when there is a change to a ReplicaSet or a Pod with an OwnerReference
// to a ReplicaSet.
//
// * Read the ReplicaSet
// * Read the Pods
// * Set a Label on the ReplicaSet with the Pod count
func (a *ReplicaSetReconciler) Reconcile(req reconcile.Request) (reconcile.Result, error) {
	// Read the ReplicaSet
	rs := &appsv1.ReplicaSet{}
	err := a.Get(context.TODO(), req.NamespacedName, rs)
	if err != nil {
		return reconcile.Result{}, err
	}

	// List the Pods matching the PodTemplate Labels
	pods := &corev1.PodList{}
	err = a.List(context.TODO(), client.InNamespace(req.Namespace).MatchingLabels(rs.Spec.Template.Labels), pods)
	if err != nil {
		return reconcile.Result{}, err
	}

	// Update the ReplicaSet
	rs.Labels["pod-count"] = fmt.Sprintf("%v", len(pods.Items))
	err = a.Update(context.TODO(), rs)
	if err != nil {
		return reconcile.Result{}, err
	}

	return reconcile.Result{}, nil
}
```

`InjectClient` 将 manager 真实的 client 赋给 `ReplicaSetReconciler`：

```go
func (a *ReplicaSetReconciler) InjectClient(c client.Client) error {
	a.Client = c
	return nil
}
```

### Builder 和 Manager

`Builder` 用来为 `Reconciler` 生成 `Controller`，`Manager` 用来管理和启动 `Controller`，直接用例子来介绍，首先生成一个 `Manager`：

```go
mgr, err := manager.New(config, manager.Options{})
if err != nil {
	log.Error(err, "could not create manager")
	os.Exit(1)
}
```

其中 config 为 client-go 的 `rest.Config`。

为 `ReplicaSetReconciler` 生成 `Controller` 并加入到 `Manager` 中：

```go
_, err = builder.
	ControllerManagedBy(mgr).  // Create the ControllerManagedBy
	For(&appsv1.ReplicaSet{}). // ReplicaSet is the Application API
	Owns(&corev1.Pod{}).       // ReplicaSet owns Pods created by it
	Build(&ReplicaSetReconciler{})
if err != nil {
	log.Error(err, "could not create controller")
	os.Exit(1)
}
```

其中 `For` 函数用于指定我们要 reconcile 的 object 类型，`Owns` 用来 watch 其 owner 是 reconcile object 类型的 object（`Owns` 可以指定多种类型），这两种类型 object 的增/删/改事件均会触发 `Reconcile` 函数。

最后启动 `Manager`，整个组件启动：

```go
if err := mgr.Start(stopCh); err != nil {
	log.Error(err, "could not start manager")
	os.Exit(1)
}
```

## 单元测试

为普通的 controller 写单元测试主要还是依赖 client-go 提供的 fake client，将测试需要的各种 object append 到一个 fake client 中，使用这个 fake client 来完成测试，有用到 lister 的话需要手动往对应的 informer indexer 中添加相应的 object，示例：

```go
// 创建 fake client
f.client = fake.NewSimpleClientset(f.objects...)

// 创建基于 fake client 的 informer
informer := informers.NewSharedInformerFactory(f.client, 1)

// 往 informer indexer 中添加 object
for _, s := range f.storageClasses {
	informer.Native().Storage().V1().StorageClasses().Informer().GetIndexer().Add(s)
}
```

controller-runtime 是使用了自己的 [envtest](https://github.com/kubernetes-sigs/controller-runtime/tree/master/pkg/envtest) 包在本地启动一个真正的 apiserver 和 etcd，然后连接这个 apiserver 进行测试，我们还是需要 fake objects，不过和 fake client 不同，这些 fake objects 是要创建到 controller-runtime 启动的 apiserver 中，如果是 CR 的话，还需要先往这个新的 apiserver 中注册 CRD。一个完整的示例：

```go
func TestNodeLocalStorageReconciler(t *testing.T) {
	// 配置 testEnv，其中包含该项单测需要的 CRD 等
	testEnv := &envtest.Environment{
		CRDs: []runtime.Object{
			newNodeLocalStorageCRD(),
		},
	}

	// 启动测试环境（etcd 和 apiserver），返回该环境的 rest config
	config, err := testEnv.Start()
	if err != nil {
		t.Fatal(err)
	}
	defer testEnv.Stop()

	// 生成 controller-runtime 需要的 client
	c, err := client.New(config, client.Options{
		Scheme: scheme,
	})
	if err != nil {
		t.Fatal(err)
	}

	// 初始化 Reconciler
	nlsReconciler := &NodeLocalStorageReconciler{
		Client: c,
	}

	// 准备好测试数据
	nls1 := test.GetNodeLocalStorage()
	nls1.Name = "test"
	if err = c.Create(context.TODO(), nls1); err != nil {
		t.Fatal(err)
	}

	// test cases
	testCases := []struct {
		describe  string
		namespace string
		name      string
		isErr     bool
	}{
		{
			describe:  "normal test",
			namespace: "",
			name:      "test",
			isErr:     false,
		},
	}

	// 测试每个 case
	for _, testCase := range testCases {
		_, err := nlsReconciler.Reconcile(reconcile.Request{
			NamespacedName: types.NamespacedName{
				Namespace: testCase.namespace,
				Name:      testCase.name,
			},
		})
		if testCase.isErr != (err != nil) {
			t.Fatalf("%s unexpected error: %v", testCase.describe, err)
		}
	}
}
```

## 总结

controller-runtime 框架本身提供了很多库来帮助构建 controller，让整个流程变得简单，屏蔽了很多通用的细节，能够让构建 controller 整个过程变得更简单，感兴趣的同学可以在不同的场景和需求下都尝试一下；即便不使用 controller-runtime 我们也可以单独使用它的 [generic client](https://github.com/kubernetes-sigs/controller-runtime/tree/master/pkg/client) 和 [envtest](https://github.com/kubernetes-sigs/controller-runtime/tree/master/pkg/envtest) 等通用库。

单独说下使用 [envtest](https://github.com/kubernetes-sigs/controller-runtime/tree/master/pkg/envtest) 需要运行环境（你本地和 CI 等环境）安装 Kubebuilder 提供的一系列 bin 文件（主要是 `etcd` 和 `kube-apiserver`），本地的话自己[下载](https://book.kubebuilder.io/quick-start.html#installation)就好了，如果是 CI 环境需要的话，可以在基础镜像里面增加这些文件，一个示例：

```text
RUN mkdir -p /usr/local && \
	wget https://go.kubebuilder.io/dl/2.3.1/linux/amd64 && \
	tar xvf amd64 && \
	mv kubebuilder_2.3.1_linux_amd64 /usr/local/kubebuilder && \
	rm amd64
```
