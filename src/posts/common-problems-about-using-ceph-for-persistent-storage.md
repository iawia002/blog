---
title: 使用 Ceph 做持久化存储的常见问题
layout: tech-post.njk
date: 2018-09-30
tags:
- post
- Kubernetes
- Ceph
---

[[toc]]

> Ceph 是一个开源的分布式对象、块和文件存储系统。Kubernetes 支持 Ceph 的块存储（Ceph RBD）和文件存储（CephFS）作为 Kubernetes 的持久存储后端。

## 前言

Ceph 集群的安装过程这些就不过多阐述了，参照官网文档就行了，可以选择直接装在物理机上（我用的这种方式），也可以使用 Helm 来安装在 k8s 集群中，按需选择吧。

下面是一些安装参考文档：

* [Preflight Checklist — Ceph Documentation](http://docs.ceph.com/docs/master/start/quick-start-preflight/)
* [Storage Cluster Quick Start — Ceph Documentation](http://docs.ceph.com/docs/master/start/quick-ceph-deploy/)
* [Installation (Kubernetes + Helm) — Ceph Documentation](http://docs.ceph.com/docs/master/start/kube-helm/)

## 安装 Ceph 集群常见问题

先说一下安装环境，参考上面的官网文档的步骤进行安装的，共 4 台服务器，1 台用来部署，其他 3 台用作 Ceph 的节点，所有服务器的操作系统都是 CentOS 7.5。

### 不要用 root 用户

[官网文档](http://docs.ceph.com/docs/master/start/quick-start-preflight/#create-a-ceph-deploy-user)明确指出了不要图方便就用 root 这种用户，极其不推荐。

### 节点数量

Ceph 默认需要 3 个 osd 节点，如果你机器数量不够可以使用下面的配置更改默认的设置：

```text
osd pool default size = 2
```

### 关于 `.ssh/config` 文件

```text
Host node1
   Hostname 192.168.21.50
   User c
```

Host name 要和机器的名称匹配。

顺便说一下，增加了这个文件之后还要更新一下 hosts 文件 `vim /etc/hosts`，把 host name 对应的 IP 地址写进去：

```text
192.168.21.50 node1
...
```

### ImportError: No module named pkg_resources

更新一下机器的 python 环境：

```text
yum install gcc python-setuptools python-devel

easy_install pip
```

### RuntimeError: NoSectionError: No section: 'ceph'

检查一下 yum 的配置文件 `/etc/yum.repos.d/` 里面 `ceph.repo` 这个文件中有没有 `ceph` 这一段，没有的话检查一下这个目录下面应该有一个 `ceph.repo.rpmnew` 的文件，使用这个新的文件即可：

```text
mv ceph.repo ceph.repo.old

mv ceph.repo.rpmnew ceph.repo
```


## 使用 Ceph 的常见问题

### Provisioner

Kubernetes 自带 Ceph RBD 的 internal provisioner，可以配置动态存储提供（Dynamic Volume Provisioning），CephFS 则需要[外置的 provisioner](https://github.com/kubernetes-incubator/external-storage/tree/master/ceph/cephfs)。

Kubernetes Storage Class 支持的 Provisioner 列表可以参考[官网文档](https://kubernetes.io/docs/concepts/storage/storage-classes/#provisioner)。

### Error creating rbd image: executable file not found in $PATH

所有 k8s 节点的物理机上都要安装 `ceph-common` 这个包（`yum install ceph-common`），这个 client 的版本要和 Ceph 集群版本一致。

### feature set mismatch missing 400000000000000

> 顺便说一下，如果你遇到了 `timeout expired waiting for volumes to attach/mount for pod` 这个错误，很可能也是下面的原因

原因是 Linux 内核版本和 Ceph 当前版本支持的不匹配（内核版本太低了，不支持当前版本的 Ceph 需要的一些特性），可以使用下面的命令来使 Ceph 兼容当前的内核版本（这么说好像不太对，大概是这个意思）：

```text
ceph osd crush tunables hammer
```

`hammer` 是对应内核支持的 Ceph 版本，对照表如下：

```text
> TUNABLE          RELEASE   CEPH_VERSION  KERNEL
> CRUSH_TUNABLES   argonaut  v0.48.1       v3.6
> CRUSH_TUNABLES2  bobtail   v0.55         v3.9
> CRUSH_TUNABLES3  firefly   v0.78         v3.15
> CRUSH_V4         hammer    v0.94         v4.1
> CRUSH_TUNABLES5  Jewel     v10.0.2       v4.5
```

当然，你也可以升级你的 Linux 内核来与之匹配。

### 访问模式

还有一个注意事项：CephFS 支持 3 种访问模式：`ReadWriteOnce`，`ReadOnlyMany`，`ReadWriteMany`，而 RBD 是块存储，仅支持两种：`ReadWriteOnce`，`ReadOnlyMany`。


### 其它问题

出现了错误仔细看一下 k8s 的报错信息，如果报错信息实在看不出什么，先检查一下各个参数有没有填对，比如 monitors 地址，密码之类的。
