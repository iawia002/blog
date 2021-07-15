---
title: Kubernetes 组件单元测试指南
layout: tech-post.njk
date: 2021-07-15
tags:
- post
- Go
- Kubernetes
- controller-runtime
- 测试
---

[[toc]]

## 前言

单元测试相关概念和基础内容这里不过多介绍，可以参考 go 官方的一些指南和网上的其它资料：

* [LearnTesting](https://github.com/golang/go/wiki/LearnTesting)
* [TableDrivenTests](https://github.com/golang/go/wiki/TableDrivenTests)

针对需要操作 k8s 的组件，单测的关键在于如何在单测的函数中构造一个 k8s 集群出来供业务函数对相应资源进行 CRUD，构造 k8s 集群的大致思路主要分为两类：使用 fake client 构造一个假的和在单测的过程中构造一个真的、轻量级的 k8s 集群；下面将逐一介绍这两种方法。

*注：根据不同的测试对象，选择合适的、能达到测试目的方法即可，不必强行使用某一种方法*

## 使用 fake client

fake client 基本只能用来 CRUD 各种资源（但其实这能覆盖到大部分场景了），一些其它的操作比如触发 informer 的 callback 事件等它是实现不了的，所以如果测试代码也想覆盖这类场景，需要使用下面的构造真正集群的方法；使用 fake client 测试步骤大致如下：

1. 构造测试数据
    * 即各种测试 case 中需要的（原生和自定义）资源对象
2. 使用上面的测试数据生成 fake client
    * 把这些测试对象 append 到 fake client 中
3. 替换业务函数使用的 client 为 fake client
    * 这个具体看业务函数是怎么实现的，怎么获取 k8s client 的

fake client 可以再细分成下面两类：

### 原生 client

指原生的 [client-go](https://github.com/kubernetes/client-go) 和使用 code-generator 生成的各 CR 的 typed client，这些 client 都提供了相应的 fake client 方法，fake client 很好构造，只用一个函数，把测试需要用到的对象都加进去就行：

```go
client := fake.NewSimpleClientset(objects...)
```

一个简单示例如下，首先业务函数定义如下：

```go
// Add adds or updates the given Event object.
func Add(kubeClient kubernetes.Interface, eventObj *corev1.Event) error {
	...
}
```

我需要测试的场景就两种：增加一个事件和更新已有的事件，针对这两个场景构造测试数据：

```go
tests := []struct {
	name             string
	objects          []runtime.Object
	event            *corev1.Event
	isErr            bool
	wantedEventCount int32
}{
	{
		name:             "exist test",
		objects:          []runtime.Object{test.GetEvent()},
		event:            test.GetEvent(),
		isErr:            false,
		wantedEventCount: 1,
	},
	{
		name:             "not exist test",
		event:            test.GetEvent(),
		isErr:            false,
		wantedEventCount: 2,
	},
}
```

根据 case 的测试数据生成 fake client 并执行测试：

```go
for _, tt := range tests {
	t.Run(tt.name, func(t *testing.T) {
		// 生成 fake client，把需要 CRUD 的资源加入进去
		client := fake.NewSimpleClientset(tt.objects...)

		// 执行函数
		err := Add(client, tt.event)
		if tt.isErr != (err != nil) {
			t.Errorf("%s Add() unexpected error: %v", tt.name, err)
		}

		// 校验结果是否符合预期
		eventObj, err := client.CoreV1().Events(tt.event.Namespace).Get(context.TODO(), tt.event.Name, metav1.GetOptions{})
		if err != nil {
			t.Errorf("%s unexpected error: %v", tt.name, err)
		}
		if eventObj.Count != tt.wantedEventCount {
			t.Errorf("%s event Count = %d, want %d", tt.name, eventObj.Count, tt.wantedEventCount)
		}
	})
}
```

*注：测试函数不一定非得像示例这样写，重点了解下流程和构造 fake client 的方法即可*

针对 controller 的测试，如果你有用到 lister 的话，还需要往对应资源的 informer 中增加需要的资源，这样业务代码里面 lister 才能读到相应的资源，简单示例如下：

```go
// 创建 fake client
f.client = fake.NewSimpleClientset(f.objects...)

// 创建基于 fake client 的 informer
informer := informers.NewSharedInformerFactory(f.client, 0)

// 往 informer indexer 中添加对应的资源对象
for _, s := range f.storageClasses {
	informer.Native().Storage().V1().StorageClasses().Informer().GetIndexer().Add(s)
}
```

之后也是替换 client 和 informer 再运行测试即可。

### generic client

指 controller-runtime 提供的 [generic client](https://github.com/kubernetes-sigs/controller-runtime/tree/master/pkg/client)，和上面的 typed client 不同的是，该 client 是一个通用的 client，可用于 CRUD 任何资源，测试方法基本和上面一样，只是构造 fake client 方法稍有不同，其它流程都一样，下面就只介绍构造 fake client 的方法，其它的内容就不再赘述了。

构造 generic client 的 fake client 的方法最大的一个不同点是它需要包含要 CRUD 的所有资源的 scheme：

```go
// 配置 scheme 和需要添加的 objects
client := fake.NewClientBuilder().WithScheme(scheme.Scheme).WithObjects(objs...).Build()
```

scheme 的一般构造方法如下：

```go
var (
	// Scheme contains all types of custom clientset and kubernetes client-go clientset
	Scheme = runtime.NewScheme()
)

func init() {
	// 添加你需要的资源的 scheme
	_ = clientgoscheme.AddToScheme(Scheme)
	_ = cosscheme.AddToScheme(Scheme)
	_ = apiextensionsv1.AddToScheme(Scheme)
}
```

## 构造轻量级集群

针对使用 fake client 不能覆盖的场景可使用这种方法进行测试，在单元测试中启动一个真实集群一般使用 controller-runtime 提供的 [envtest](https://github.com/kubernetes-sigs/controller-runtime/tree/master/pkg/envtest) 库，非常方便，由于是启动了一个真实的集群，该方法适用于任何 client。

测试步骤大致如下：

1. 准备集群相关配置并启动集群
    * 一般不需要额外配置，一个函数即可启动，如果有想要预注册 CRD 等才需要配置，配置项较多，可以参考 https://github.com/kubernetes-sigs/controller-runtime/blob/master/pkg/envtest/server.go#L105
2. 使用上面创建的集群的 kube config 来生成各种 client
3. 创建测试数据（如果需要的话）
4. 进行测试，完成后销毁集群

启动集群方法如下：

```go
// 生成 env，这里面有很多配置项，可以根据需要配置
testEnv := &envtest.Environment{}

// 启动环境，返回值是环境的 rest.Config，可用于生成各 kube client
config, err := testEnv.Start()
if err != nil {
	t.Fatal(err)
}

// 销毁集群
testEnv.Stop()
```

注意，该方法需要提前安装 kubebuilder，它依赖 kubebuilder 包提供的 apiserver 那几个 binary 文件，本地的话自己[下载](https://book.kubebuilder.io/quick-start.html#installation)安装就好了，如果是 CI 环境需要的话，可以在基础镜像里面增加这些文件，一个示例：

```text
RUN mkdir -p /usr/local && \
	wget https://go.kubebuilder.io/dl/2.3.1/linux/amd64 && \
	tar xvf amd64 && \
	mv kubebuilder_2.3.1_linux_amd64 /usr/local/kubebuilder && \
	rm amd64
```

下面是针对普通 client 的一个简单示例，业务函数定义如下：

```go
// Create creates the given CRD objects or updates them if these objects already exist in the cluster.
func Create(client clientset.Interface, crds ...*apiextensionsv1.CustomResourceDefinition) error {
	...
}
```

测试准备：

```go
// 启动测试集群
testEnv := &envtest.Environment{}
config, err := testEnv.Start()
if err != nil {
	t.Fatal(err)
}
defer testEnv.Stop()

// 生成需要的 apiextension client
apiextensionClient, _ := apiextensionsclient.NewForConfig(config)
```

之后再使用上面的 `apiextensionClient` 去执行测试即可。

针对 generic client 的一个简单示例如下：

```go
// 启动测试集群
testEnv := &envtest.Environment{}
config, err := testEnv.Start()
if err != nil {
	t.Fatal(err)
}
defer testEnv.Stop()

// 生成 generic client
cli, err := client.New(config, client.Options{
	Scheme: scheme,
})
if err != nil {
	t.Fatal(err)
}

// 准备测试数据
sc1 := test.GetStorageClass()
sc1.Name = "sc1"
sc1.Provisioner = "example.com/test"
// 创建测试数据
if err := cli.Create(context.TODO(), sc1); err != nil {
	t.Fatal(err)
}

// 开始执行测试...
```

## 常用场景对比

|               | fake client        | 真实集群             |
| ------------- | ------------------ | -------------------- |
| 资源 CRUD     | 支持               | 支持                 |
| 使用 lister   | 支持，需要额外处理 | 支持，无需额外处理   |
| informer 事件 | 不支持，无法触发   | 支持                 |
| 运行依赖      | 无                 | 需要安装 kubebuilder |

fake client 使用简单，非常轻量级，执行速度快，但是它基本只能覆盖资源 CRUD 场景，其它操作的业务代码无法覆盖，还有一些场景能覆盖到但是需要一些额外的操作，稍微麻烦一点；构造真实集群完全能模拟组件运行在线上集群中的情况，几乎所有的业务代码只要想测都能覆盖到，但是执行速度较慢，对环境有特殊要求；选择哪种方案的一个简单判断方法是，用 fake client 测试能覆盖到的用 fake client，fake client 覆盖不到的再用构造真实集群的方法。
