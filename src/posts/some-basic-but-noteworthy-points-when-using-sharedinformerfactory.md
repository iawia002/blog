---
title: 在使用 SharedInformerFactory 时一些很小但值得注意的问题
layout: tech-post.njk
date: 2020-05-11
tags:
- post
- Go
- Kubernetes
- client-go
---

[[toc]]

近期在工作中被不同的同事问了一些类似的、关于 SharedInformerFactory 的问题，有些问题非常小，很细节，虽然小但是我觉得是值得注意的问题，所以打算总结分享一下。

## 不要使用 goroutine 来启动 SharedInformerFactory

我不是说用 goroutine 来启动就一定是错的，但是用 goroutine 来启动 `SharedInformerFactory` 没有意义，因为这个方法根本就不会 block，直接启动就好了，`Start` 方法的源代码：

```go
// Start initializes all requested informers.
func (f *sharedInformerFactory) Start(stopCh <-chan struct{}) {
	f.lock.Lock()
	defer f.lock.Unlock()

	for informerType, informer := range f.informers {
		if !f.startedInformers[informerType] {
			go informer.Run(stopCh)
			f.startedInformers[informerType] = true
		}
	}
}
```

使用 goroutine 来启动还有另一个问题：它可能导致 `WaitForCacheSync` 不再起作用，`WaitForCacheSync` 方法必须要在 informer factory 完全启动（这个方法执行完成）之后再调用，不然它会拿到错误的已启动 informers 的数据，导致它并没有等待所有 informers 启动就返回结果了，看源代码：

```go
// WaitForCacheSync waits for all started informers' cache were synced.
func (f *sharedInformerFactory) WaitForCacheSync(stopCh <-chan struct{}) map[reflect.Type]bool {
	informers := func() map[reflect.Type]cache.SharedIndexInformer {
		f.lock.Lock()
		defer f.lock.Unlock()

		informers := map[reflect.Type]cache.SharedIndexInformer{}
		for informerType, informer := range f.informers {
			if f.startedInformers[informerType] {
				informers[informerType] = informer
			}
		}
		return informers
	}()

	res := map[reflect.Type]bool{}
	for informType, informer := range informers {
		res[informType] = cache.WaitForCacheSync(stopCh, informer.HasSynced)
	}
	return res
}
```

`WaitForCacheSync` 需要从 `f.startedInformers` 中获取已启动 informers 的数据，而 `f.startedInformers` 是在执行 `Start` 方法时填充的，使用 goroutine 来启动 `SharedInformerFactory` 之后再正常 wait for sync 往往都是 `WaitForCacheSync` 函数先于 `Start` 方法执行，它会先拿到锁，等到它执行完了 `Start` 才会开始执行，导致该函数完全没有起到 wait 的效果；可以用下面的示例代码（可自行调整用 goroutine 来启动不同的方法）来看看效果：

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

type factory struct {
	lock sync.RWMutex
	data map[string]string
}

func (f *factory) method1() {
	f.lock.Lock()
	defer f.lock.Unlock()

	f.data["k1"] = "v1"
	f.data["k2"] = "v2"
}

func (f *factory) method2() {
	a := func() {
		f.lock.Lock()
		defer f.lock.Unlock()

		for k, v := range f.data {
			fmt.Println(k, v)
		}
	}
	a()
}

func main() {
	f := &factory{
		data: make(map[string]string),
	}
	f.method1()
	f.method2()
	time.Sleep(time.Second * 1)
}
```

<table>
<thead><tr><th>Wrong</th><th>Correct</th></tr></thead>
<tbody>
<tr>
<td>

```go
go informerFactory.Start(stopCh)

informerFactory.WaitForCacheSync(stopCh)
```

</td>
<td>

```go
informerFactory.Start(stopCh)

informerFactory.WaitForCacheSync(stopCh)
```

</td>
</tr>
</tbody>
</table>


## 正确启动 SharedInformerFactory

在调用 `informerFactory.Start` 方法之前，你必须保证直接或间接调用了你想使用的 informer 的 `Informer()` 方法，否则之后 `Start` 方法不会起作用，它不会启动任何东西；调用示例：

<table>
<thead><tr><th>直接调用</th><th>间接调用</th></tr></thead>
<tbody>
<tr>
<td>

```go
informerFactory.Core().V1().Pods().Informer()
```

</td>
<td>

```go
informerFactory.Core().V1().Pods().Lister()
```

</td>
</tr>
</tbody>
</table>

其中 `Lister` 方法会调用 `Informer` 方法，而 `Informer` 方法会调用 factory 的 `InformerFor` 方法，该方法会将当前 informer 数据写入到 factory 中，后续启动的时候会使用到：

```go
// InternalInformerFor returns the SharedIndexInformer for obj using an internal
// client.
func (f *sharedInformerFactory) InformerFor(obj runtime.Object, newFunc internalinterfaces.NewInformerFunc) cache.SharedIndexInformer {
	f.lock.Lock()
	defer f.lock.Unlock()

	informerType := reflect.TypeOf(obj)
	informer, exists := f.informers[informerType]
	if exists {
		return informer
	}

	resyncPeriod, exists := f.customResync[informerType]
	if !exists {
		resyncPeriod = f.defaultResync
	}

	informer = newFunc(f.client, resyncPeriod)
	f.informers[informerType] = informer

	return informer
}
```

<table>
<thead><tr><th>Wrong</th><th>Correct</th></tr></thead>
<tbody>
<tr>
<td>

```go
informerFactory := informers.NewSharedInformerFactory(kubeClient, 0)
informerFactory.Start(stopch)
podLister := informerFactory.Core().V1().Pods().Lister()
...
```

</td>
<td>

```go
informerFactory := informers.NewSharedInformerFactory(kubeClient, 0)
podLister := informerFactory.Core().V1().Pods().Lister()
informerFactory.Start(stopch)
...
```

</td>
</tr>
</tbody>
</table>

上面错误的方法中，`informerFactory` 不会启动也不会缓存任何东西，`podLister` 会永远返回空结果。

在一些通用框架的场景下也可以使用 `ForResource` 方法来手动“注册”一个资源，它其实也是调用了对应资源的 `Informer` 方法：

```go
type SharedInformerFactory interface {
	...
	ForResource(resource schema.GroupVersionResource) (GenericInformer, error)
}

// ForResource gives generic access to a shared informer of the matching type
func (f *sharedInformerFactory) ForResource(resource schema.GroupVersionResource) (GenericInformer, error) {
	switch resource {
	// Group=snapshot.storage.k8s.io, Version=v1beta1
	case v1beta1.SchemeGroupVersion.WithResource("volumesnapshots"):
		return &genericInformer{resource: resource.GroupResource(), informer: f.Snapshot().V1beta1().VolumeSnapshots().Informer()}, nil
	case v1beta1.SchemeGroupVersion.WithResource("volumesnapshotclasses"):
		return &genericInformer{resource: resource.GroupResource(), informer: f.Snapshot().V1beta1().VolumeSnapshotClasses().Informer()}, nil
	case v1beta1.SchemeGroupVersion.WithResource("volumesnapshotcontents"):
		return &genericInformer{resource: resource.GroupResource(), informer: f.Snapshot().V1beta1().VolumeSnapshotContents().Informer()}, nil

	}

	return nil, fmt.Errorf("no informer found for %v", resource)
}
```
