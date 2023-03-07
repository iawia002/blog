---
title: 2022 年终总结
layout: post.njk
date: 2022-12-31
tags:
- post
- 流水帐
---

[[toc]]

## 生活

我还是从 Google 的 [Year in Search](https://about.google/intl/zh_cn/stories/year-in-search/) 视频说起，今年的年度关键词是 `can i change`：

> This year, the world searched “can i change” more than ever before. From changing careers to seeking new outlooks on life, people are finding ways to reimagine themselves and reshape the world around them.
>
> 2022 年，随着世界重焕活力并迈入新时代，人们比以往更有热情和动力去搜寻全新的可能。

今年于我也是改变的一年，从开始工作以来我就要每个月交钱给父母，他们帮我保管起来，他们希望我多存些钱，我知道他们是好心，但这件事真的太限制和压抑我了，我想做的事情不能做，想买的东西不能买，我也一直就逆来顺受，没想过沟通和改变，直到去年底那两个月，我换了一些电子设备，还有些杂七杂八的事情花了很多钱，两个月我都没交钱给我爸，然后他打电话来质问我，我给他解释了但他还是很生气，后面我就直接不说话把电话挂了，再后来我妈又发微信过来和我聊了下，从今年开始我就没再交钱了，自己保管，每个月剩多少存多少。

在夺回我的财政大权之后，我也开始真正践行[活在当下](https://xinzhao.me/posts/2021-summary/#%E6%B4%BB%E5%9C%A8%E5%BD%93%E4%B8%8B%E5%92%8C%E4%B8%8D%E5%8D%91%E4%B8%8D%E4%BA%A2)，想买的东西就买，想做的事情马上做，把一切都献给现在，今年也尝试了很多人生中第一次做的事情。

### 🏂

今年年初我正式开始学习我心心念念的单板滑雪，选单板除了看起来更酷以外，还有一个很重要的原因：双板的雪杖在我看来是束缚，我不喜欢手上拿着个东西滑雪，我喜欢无拘无束的感觉。

到目前为止我都在融创室内雪场学习和练习单板，刚开始学起来要稍微难一点，也动不动就摔，不过千万不要因为摔跤这些气馁，我向你保证，只要稍微会一点之后，你就能体会到滑雪的快乐，贴地飞行，连风里都是自由的味道。

最开始图方便，我的装备都是网上随便买的，就买了那种不上不下的新手入门装备，想着等以后会点了再换好点的装备，这种想法其实不太好，就应该（在预算范围内）直接拉满，不然没玩儿多久又想换，要换的话当初买这些装备就都算额外的成本，比当初直接拉满花得更多；还有一个点，第一次买滑雪的装备最好去线下店试着买，除非你已经是老手了，否则都不建议在网上买，特别是雪鞋，一定要试试穿着是否舒适，长度是否合适，线下还可以多和店员沟通交流一下，他们见多识广，能根据你的情况给你建议和推荐。

说到装备还有一件事，最开始我买的固定器是一种半快穿式的，你把脚放进去，手再把背板拉起来扣上就行了，不用每次都去收紧绑带：

![](/img/2022-summary/1.jpg)

听起来比传统固定器方便是吧，但其实这种不上不下的东西最垃圾，看起来两头都占，实际上两头都不占，它既没有 [Step On](https://www.burton.com/us/en/content/step-on.html) 那种快穿方便（直接踩上去就完了，都不用弯腰），也没有传统固定器可靠和稳定，上限不高，花里胡哨的；在用了几次之后我还是决定换掉它，换成传统固定器，还是这种结构简单的东西最可靠，上限也最高。

### 旅行

今年国庆长假终于下定决心要出去走走，实在不想整整 7 天又窝在家里啥也不干，再加上那段时间机会正好，成都的疫情不算太严重，至少我在的那个区是低风险的，去另一些低风险的地方不用隔离，再加上我真的挺悲观的，我担心以后的局势会越来越严格，当时不认为短期内会放开，有些人真的食髓知味，毫无代价得到了生杀予夺的权力，一条狗都以为自己是警犬吧，怎么可能轻易就放弃；所以只要有机会，我一定要出去走走。

最后就选了北海和涠洲岛作为目的地，内陆长大的孩子太渴望大海了，当时回来写了一篇[游记](https://xinzhao.me/posts/2022-beihai-and-weizhou-island-tour/)，记了些流水帐、旅途中遇到的有趣的事和拍的照片，感兴趣可以移步看看，这里就不再多说了。

## 工作

和去年不同，今年没有换工作也没有什么太大的变化，工作正常推进，没有太多值得讲的东西。

今年我开启了两个新的项目：
* [pandora](https://github.com/iawia002/pandora): Code snippets and examples for writing Go/Kubernetes services/applications.
* [lia](https://github.com/iawia002/lia): Common libraries for writing Go/Kubernetes services/applications.

本质上是同一类东西，这两个 repo 收集了我工作中常用到的一些 Go/Kubernetes 的开发库和代码示例，不过这还是非常个人向的项目，可能不会经常更新，我不会为了更新而更新，还是跟着我的工作节奏来，工作中有发现值得提炼成一个公共库或者值得记录的代码片段的话就会更新。

最初我是把所有东西都放在 [pandora](https://github.com/iawia002/pandora) 这个 repo 里面的，后面感觉如果把它当作一个依赖库来用的话，它的描述又容易引人误解，认为这不是一个正式的项目，所以我把里面的`公共代码库`这一部分单独剥离了出来放到了 [lia](https://github.com/iawia002/lia) 里面，[pandora](https://github.com/iawia002/pandora) 就只包含代码片段和示例，如果有人也需要使用我的一些公共代码库的话就可以直接依赖更“正式”的 [lia](https://github.com/iawia002/lia)。

这是我很早之前就应该着手做的东西，今年终于正式做起来了，代码片段这类知识库是我认为非常值得去系统构建和维护的，一方面这可以充当你的速查“词典”，当你忘记某种设计要怎么实现时，可以来翻一翻，又或者当你开始开发一个新的组件的时候，你可以直接从这个代码库来复制粘贴一些基础代码，不用从头开始写，也不用胡乱地去翻以前的项目；另一方面，归类和整理这个过程本身也会加深你对那段代码和它背后原理的理解。

### KCD 成都站

今年年初的时候，那段时间我一直在参与 [Karmada](https://github.com/karmada-io/karmada) 的贡献，华为 [Karmada](https://github.com/karmada-io/karmada) 的人就联系我，问我要不要去 2 月底要召开的 [Kubernetes Community Days](https://community.cncf.io/kubernetes-community-days/about-kcd/) 成都站做个关于 [Karmada](https://github.com/karmada-io/karmada) 的演讲，我欣然地答应了，当天回去就提交了议题，最后我的议题也被选中了（虽然评分最低最后一个讲），收获了人生中第一次在技术会议上演讲的体验。

![](/img/2022-summary/2.jpg)
![](/img/2022-summary/3.jpg)
![](/img/2022-summary/4.jpg)

不过整个过程也是非常坎坷，原定是 2 月底召开的，然后碰上疫情延期，后面就重启一次延期一次，非常离谱的是，每次看着成都没有疫情了，主办方就选日子重启，然后只要一重启，成都必再出现疫情，而且会慢慢变严重，最后就不让举办这种会议；从 2 月份一直推迟到 11 月中终于召开了，当天来的人也不多，可能是因为疫情要求 24 小时核酸，也可能是选的时间是周五的原因。

说到选周五还有一个插曲，那天晚上会议结束了讲师聚餐，就和主办方聊到了这件事，他们说问了一些成都人，那些人说选周六没有人会来的，因为周末成都人都在外面玩儿（这就是成都），所以才选了周五 🤷‍♂️。

## 这一年买的有趣的东西

### 陆地冲浪板

春天的时候没再去滑雪了（虽然室内滑雪场也可以滑），当时就想着找点新的事情做，偶然了解到陆地冲浪板，感觉还挺有意思的，就买了一块来玩玩：

![](/img/2022-summary/IMG_9709.jpg)

5 月初和同事们去骑[天府绿道](http://www.cdghg.com.cn/cdsghg/c121963/2018-12/11/content_e66eb60204a54492949b201446cff5fe.shtml)，那时候我刚会一点陆冲，能 Pumping 着前进（不过姿态不好看），我不知天高地厚，直接带着陆冲板去，准备去滑天府绿道，结果刚开始就明白我这个想法有多蠢了，滑这个和他们骑自行车相比实在太慢太慢了，而且上坡上不去，下坡又刹不住（我还不会），上坡我就拉着一个同事的自行车，让他带我上去，因为拉着我，他每次就要站起来使劲蹬，事后他锐评自己：“我跟个拉黄包车的一样”，我当时真的笑不活了。

![](/img/2022-summary/IMG_1875.jpg)

当天还有一个插曲，那天滑陆冲没有戴护具，当时没啥安全意识，然后在过一个桥的时候，桥每过一段就有一个拼接的缝隙，我当时没注意到那个缝隙稍微有点宽，过的时候板的轮子卡在缝里面了，板停在原地，我人直接飞出去跪在地上磨了一段，一只膝盖被磨掉一层皮，现在都还没好，那个地方新长出来的肉有点恶心，而且看起来不能恢复成正常样子了，这是真·血的教训。

### 电动滑板

陆冲板买了没玩多久就到夏天了，太热了就没再练习，跑去游泳去了，10 月份的时候又把它翻了出来在小区里面溜达，那天刚好碰到一个玩电动滑板的，就和他聊了几句，又有点心动，然后双十一就买了一块电动滑板：

![](/img/2022-summary/IMG_9710.jpg)

这个还比较好上手，和普通长板类似，适应一会儿就能满街跑了，不过还是要注意安全，这个就和电瓶车性质差不多了，头盔非常重要，一定要戴。

滑着电动滑板在街上和公园里面穿梭的感觉真的好棒，和滑雪那时候感受到的自由的味道非常像，御剑飞行。

滑着这个在外面听到的最多的一句话就是：“这是电动的吧”；在公园的时候，小朋友的家长见到我都会冲他们的小孩儿说：“小心一点，车来了”，滑板车也是车是吧。

当时买的时候还想着可以用来上下班代步，实践了一天，上班的时候吓死我了，早高峰各种自行车/电瓶车都比较多，我要和他们去挤，而且那天我家出来那一段地又是湿的，我那套轮胎防滑性能不怎么好，在湿地上刹车必侧滑，当时还因为这个差点摔着（当然主要是因为我注意力不集中，急刹了一次）；晚上下班回去体验就非常好了，一路上人不多，可以非常自由地滑。

不过年底越来越冷了就代步了那一次，等明年春暖花开的时候再来，现在就用来周末去公园玩陆冲的时候代代步或者天气好的时候出去闲逛。

### BE@RBRICK

今年完成了去年底年终总结立的 [flag](https://xinzhao.me/posts/2021-summary/#be%40rbrick)，买了一个 1000% 的熊：

![](/img/2022-summary/5.jpg)
<p class="caption">BE@RBRICK x NASA Space Shuttle</p>

### 电视和路由器

为什么提到了这两样东西呢，我并不是什么电视/路由器专家要推荐一些不错的品牌和型号之类的，事情是这样的：之前我家里面就只有客厅装了电视，但我平常一般都在自己的房间里面活动，客厅的电视也很少打开，晚上就躺床上抱着自己的电脑看些剧之类的，你说不方便吧，其实又挺方便的，躺床上放被子上面就行了，电池也基本够我晚上两三个小时不插电用，Retina 屏幕素质也不错，但你说方便吧，也没那么方便，主要是对着一块 16 寸的屏幕看剧实在谈不上什么体验感；所以今年年中我终于下手买了一台 65 寸的 4K 电视挂在房间里面，现在晚上回去就直接把电脑放桌上，连上电视，躺床上追剧，体验感不知道翻了多少倍，而且也能用来当 Switch 的外接显示器，玩游戏的体验感也直线上升。

再来说路由器，最开始我家里就只买了一个路由器，放在我房间的，然后入户的光猫也有 WI-FI 的功能，所以我家里就有两个不一样的 WI-FI，客厅就连光猫那个 WI-FI，在房间就连另一个，对于大部分固定的电器来说没啥问题，问题就出在手机上，我的手机只要连上了客厅的再回房间，信号不管有多弱，它也不会断开重连，虽然连接着但实际上根本没法用，就导致了我每次回房间都要手动切换一下 WI-FI，这个动作我每天都要做几次（其实很不方便，我也不知道我为什么忍了这么久）；还有一个不方便的点是：有些地方刚好是两个 WI-FI 都覆盖不到的死角，比如厕所，哪个 WI-FI 都连不上，那个地方手机信号也不是很好；所以今年双 11 我终于准备好好调整一下家里的网络环境了，下单了两台路由器准备组一个网，现在一个 WI-FI 覆盖整个家，一点死角都没有，我也再不用去手动切换 WI-FI 了。

这两样东西都不贵，但真是我今年，甚至是近两年买过幸福感最高的东西了，没有之一；所以真的不要忍受，哪怕只有一丁点不舒服也不要忍受。

## 写在最后

今年真是改变的一年，不止我自己，大环境也在年底发生巨变，百年抗疫居然提前九十七年结束，先左打死再右打死这种操作属实难以预料，既然放开了，希望明年能去更多的地方旅行，去见更多的山川河海，去体会更多的风土人情。