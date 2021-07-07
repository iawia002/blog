---
title: Kubernetes CRD v1 介绍
layout: tech-post.njk
date: 2021-07-06
tags:
- post
- Kubernetes
- CRD
---

[[toc]]

## 前言

CRD API 在 Kubernetes v1.16 版本 GA 了，所以打算来聊一聊关于 CRD v1 版本的一些特性和一些常见的问题；关于 CRD 基础内容可能会一笔带过，不会涉及到太多，基础内容可以在 Kubernetes 官方文档上了解一下（后面[参考链接](#参考链接)有），可以更多地把这篇文章当作遇到问题时的速查手册。

CRD 是扩展 Kubernetes 最常见和最方便的方法，除了提供定义 custom resource（CR）的基本能力外，CRD 还提供了很多扩展能力，包括 schema、多版本、版本之间的 conversion、subresource 子资源等，本文主要介绍下面四部分的内容：

* metadata: 定义了 CR 的基本信息，比如 API group 和名称
* versions: 定义 CR 的版本信息
* schema: 定义 CR 的结构和字段类型等信息
* subresource: 定义 CR 的子资源信息

## metadata

最基础但是最重要的部分，metadata 包含的主要内容是：

* 自定义资源 CR 的名称
* 该 CR 所属的 API group
* scope: 资源是 Namespace 级别还是 Cluster 级别

下面是一个比较完整的例子（注释基本是从 K8s 官方文档上摘抄的，就不翻译了），假设我们要定义一种新的 `VolumeSnapshot` 资源：

```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  # the name of this CR, must match the spec fields below, and be in the form: <plural>.<group>.
  name: volumesnapshots.xinzhao.me
spec:
  # group is the API group of the defined custom resource.
  #	The custom resources are served under `/apis/<group>/...`.
  #	Must match the name of the CustomResourceDefinition (in the form `<names.plural>.<group>`).
  group: xinzhao.me
  names:
    # kind is normally the CamelCased singular type. Your resource manifests use this.
    kind: VolumeSnapshot
    # listKind is the serialized kind of the list for this resource. Defaults to "`kind`List".
    listKind: VolumeSnapshotList
    # plural name to be used in the URL: /apis/<group>/<version>/<plural>
    plural: volumesnapshots
    # singular name to be used as an alias on the CLI and for display
    singular: volumesnapshot
    # shortNames allow shorter string to match your resource on the CLI
    # kubectl get volumesnapshot/vss
    shortNames:
    - vss
  # either Namespaced or Cluster
  scope: Namespaced
```

其中 `group` 必须是域名，不然创建的时候就会报下面的错：

```text
The CustomResourceDefinition "volumesnapshots.test" is invalid: spec.group: Invalid value: "test": should be a domain with at least one dot
```

## versions

定义了 CR 的版本信息，包括哪些版本是可用的，每个版本的结构信息，不同版本之间的转换策略等。

目前有两种版本转换的策略：

* None: 默认的策略，只改 `apiVersion`，其它字段不管，旧版本有，但是新版本没有的字段的数据会直接丢失，同名但是结构不匹配的会报错
* [Webhook](https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definition-versioning/#webhook-conversion): 可以配置自定义的转换，API Server will call to an external webhook to do the conversion

还是再通过一个例子来看看整体结构：

```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  ...
spec:
  ...
  # list of versions supported by this CustomResourceDefinition
  versions:
  - name: v1beta1
    served: true
    storage: true
    additionalPrinterColumns:
    - name: PVC
      type: string
      jsonPath: .spec.pvcName
    schema:
      ...
  # The conversion section is introduced in Kubernetes 1.13+ with a default value of
  # None conversion (strategy sub-field set to None).
  conversion:
    # None conversion assumes the same schema for all versions and only sets the apiVersion
    # field of custom resources to the proper value
    strategy: None
```

关于多版本的常见问题：

* 每个版本都可以通过 `served` 字段启用/禁用；有且仅有一个版本能被标记为存储版本（`storage = true`）
* get `served` 为 `false` 的版本会直接报错：
  ```text
  Error from server (NotFound): Unable to list "xinzhao.me/v1, Resource=volumesnapshots": the server could not find the requested resource (get volumesnapshots.xinzhao.me)
  ```
* 创建的 CR 的版本最终均为 `storage = true` 的那个版本，创建以前的版本也会被转换成新版本的
* 如果存在以前的版本的 object，在更新这个 object 时会转换成 `storage = true` 的那个版本
* 转换均是通过 `conversion` 配置的 `strategy` 来进行的
* 当你获取资源时（比如使用 `kubectl get`），如果指定的版本与对象的存储时的版本不同，k8 会处理多版本之间的转换（by conversion），返回你指定的那个版本，但是这只是显示上的转换，实际上 etcd 中的数据还是老版本的，只有更新才会真正转换；如果 conversion 出问题的话，会报错：
  ```text
  Error from server: conversion webhook for xinzhao.me/v1beta1, Kind=VolumeSnapshot failed: Post <https://example-conversion-webhook-server.default.svc:443/crdconvert?timeout=30s:> service "example-conversion-webhook-server" not found
  ```

### schema

version 的一部分，定义了 CR 的结构信息，每个版本都有自己独立的 schema 结构，描述了 CR 有哪些字段，以及每个字段的类型等；schema 使用了 [JSON Schema 标准](http://json-schema.org/specification.html)，一个简单的例子如下：

```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  ...
spec:
  ...
  versions:
  - name: v1beta1
    served: true
    storage: true
    schema:
      openAPIV3Schema:
        type: object
        properties:
          spec:
            type: object
            properties:
              pvcName:
                type: string
```

该 CR 我们只定义了 `spec` 并且只有一个字段 `pvcName`，所以创建一个该 CR 的 YAML 文件如下：

```yaml
apiVersion: xinzhao.me/v1beta1
kind: VolumeSnapshot
metadata:
  name: s1beta1
  namespace: default
spec:
  pvcName: pvc1
```

每个字段都可以设置默认值，这个字段是什么类型的，在 yaml 中 `default` 的值就要是什么类型的，比如我有下面三种类型的字段：

```yaml
properties:
  type:
    type: array
    items:
      type: string
    default:
    - "test"
  name:
    type: string
    default: "test"
  size:
    type: number
    default: 1
```

字段还支持校验，比如 `int` 可以规定一个最大/最小值的范围，`string` 支持正则表达式校验和 enum 枚举。具体每种类型支持什么校验可以参考：[JSON Schema Validation](http://json-schema.org/draft/2019-09/json-schema-validation.html)，一个例子：

```yaml
properties:
  type:
    type: array
    items:
      type: string
    minItems: 2
  name:
    type: string
    pattern: '\\w+'
  size:
    type: number
    minimum: 1
    maximum: 10
```

schema 的一些常见问题：

* 所有字段必须在 `schema` 中定义，不然会报错：
  ```text
  error: error validating "snapshot-v1beta1.yaml": error validating data: ValidationError(VolumeSnapshot): unknown field "spec" in ...; if you choose to ignore these errors, turn validation off with --validate=false
  ```
* 如果想要存储没有事先定义的字段的话，可以给相应的父字段加上 `x-kubernetes-preserve-unknown-fields: true` 属性
* 定义了的字段可以不填，也可以配置 `required` 要求某些字段必填：
  ```yaml
  schema:
    openAPIV3Schema:
      type: object
      properties:
        spec:
          type: object
          properties:
            pvc:
              type: object
              required: ["size"]
              properties:
              ...
  ```
  * 如果这个 `spec.pvc.size` 字段没填的话就会报错
* 如果关闭校验的话（`kubectl create --validate=false ...`），未定义的字段会被直接丢弃掉，不会存储
* type 没有 map 类型，可以使用 `type: object` 配合 `x-kubernetes-map-type` 或者 `x-kubernetes-preserve-unknown-fields` 来充当 map 类型（允许任何字段）


## subresource

支持两种类型的 subresource，一个是 [Status subresource](https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definitions/#status-subresource)，一个是 [Scale subresource](https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definitions/#scale-subresource)，下面的例子中，status 和 scale 两种 subresource 都启用了：

```yaml
# subresources describes the subresources for custom resources.
subresources:
  # status enables the status subresource.
  status: {}
  # scale enables the scale subresource.
  scale:
    # specReplicasPath defines the JSONPath inside of a custom resource that corresponds to Scale.Spec.Replicas.
    specReplicasPath: .spec.replicas
    # statusReplicasPath defines the JSONPath inside of a custom resource that corresponds to Scale.Status.Replicas.
    statusReplicasPath: .status.replicas
    # labelSelectorPath defines the JSONPath inside of a custom resource that corresponds to Scale.Status.Selector.
    labelSelectorPath: .status.labelSelector
```

### status subresource

开启 status subresource 之后，整个 CR 的内容将被分为 `spec` 和 `status` 两部分，分别表示资源期望的状态和资源的实际状态，然后该资源的 API 会暴露一个新的 `/status` 接口，这个 CR 的创建/更新接口会校验整个内容（包括 `status` 的），但是 `status` 整个会被忽略，`status` 只能通过 `/status` 接口来更新，`/status` 接口只会更新/校验 `status` 的内容，其它的会被忽略。

针对 client-go，只要 type 定义了 `Status` 就会生成 `UpdateStatus` 方法：

```go
// +genclient
// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object

// Snapshot is the snapshot object of the specified PVC.
type Snapshot struct {
	metav1.TypeMeta `json:",inline"`
	// Standard object's metadata.
	// More info: <https://git.k8s.io/community/contributors/devel/api-conventions.md#metadata>
	// +optional
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   SnapshotSpec   `json:"spec,omitempty"`
	Status SnapshotStatus `json:"status,omitempty"`
}

// SnapshotInterface has methods to work with Snapshot resources.
type SnapshotInterface interface {
	Create(*v1beta1.Snapshot) (*v1beta1.Snapshot, error)
	Update(*v1beta1.Snapshot) (*v1beta1.Snapshot, error)
	UpdateStatus(*v1beta1.Snapshot) (*v1beta1.Snapshot, error)
	...
}

// UpdateStatus was generated because the type contains a Status member.
// Add a +genclient:noStatus comment above the type to avoid generating UpdateStatus().
func (c *snapshots) UpdateStatus(snapshot *v1beta1.Snapshot) (result *v1beta1.Snapshot, err error) {
	result = &v1beta1.Snapshot{}
	err = c.client.Put().
		Namespace(c.ns).
		Resource("snapshots").
		Name(snapshot.Name).
		SubResource("status").
		Body(snapshot).
		Do().
		Into(result)
	return
}
```

### scale subresource

和 status subresource 类似，启用之后也会暴露一个新的 `/scale` 接口，但是我基本没使用过这个，就不过多介绍了，可以看下官方的文档，scale subresource 启用之后还可以使用 `kubectl scale` 来单独控制资源的副本数量：

```shell
kubectl scale --replicas=5 crontabs/my-new-cron-object
crontabs "my-new-cron-object" scaled

kubectl get crontabs my-new-cron-object -o jsonpath='{.spec.replicas}'
5
```

## 参考链接

* [Extend the Kubernetes API with CustomResourceDefinitions](https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definitions/)
* [Versions in CustomResourceDefinitions](https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definition-versioning/)
* [JSON Schema Specification](http://json-schema.org/specification.html)
