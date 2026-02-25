---
title: "深入TCP协议——tcp_tw_reuse和tcp_tw_recycle"
date: 2023-07-20T20:24:38+08:00
draft: false
summary: "前情提要： 我们已经知道TCP四次挥手中，主动方在收到被动方的FIN数据包之后会进入TIME_WAIT状态等待2MSL的时间后才进入CLOSED。在 Linux 操作系统下，TIME_WAIT 状态的持续时间是 60 秒，这意味着这 60 秒内，客户端一直会占用着这个端口，这是有一定的开销的。如果如果主动关闭连接方的 "
tags: [Linux, TCP]
categories: [Networking]
source: csdn
source_id: "131839126"
---

前情提要：[深入理解Linux网络——TCP协议三次握手和四次挥手详细流程](<https://blog.csdn.net/qq_25046827/article/details/131836333?spm=1001.2014.3001.5502>)

我们已经知道TCP四次挥手中，主动方在收到被动方的FIN数据包之后会进入TIME_WAIT状态等待2MSL的时间后才进入CLOSED。在 Linux 操作系统下，TIME_WAIT 状态的持续时间是 60 秒，这意味着这 60 秒内，客户端一直会占用着这个端口，这是有一定的开销的。如果如果主动关闭连接方的 TIME_WAIT 状态过多，占满了所有端口资源，则会导致无法创建新连接。

不过，Linux 操作系统提供了两个可以系统参数来快速回收处于 TIME_WAIT 状态的连接（这两个参数都是默认关闭的），分别是net.ipv4.tcp_tw_reuse和net.ipv4.tcp_tw_recycle。

#### 一、tcp_tw_reuse

如果开启该选项的话，客户端 在调用 connect() 函数时，**内核会随机找一个 TIME_WAIT 状态超过 1 秒的连接给新的连接复用** 。这其实就是相当于缩短了 TIME_WAIT 状态的持续时间。

这里既然我们缩短了TIME_WAIT状态的时间，使其不是2MSL，那么因为引入TIME_WAIT解决的问题就再次出现了，所以tcp_tw_reuse也需要解决这两个问题：

  1. 防止历史连接中的数据，被后面相同四元组的连接错误的接收
  2. 保证被动关闭连接的一方能够正确的关闭

首先看第一个问题，因为如果在历史连接上建立了新的连接，而网络中此时还有历史连接残留的数据包存活，那么它们有可能在新连接建立之后到达，那么就会导致接收到错误的数据。TIME_WAIT的解决方法就是等待2MSL之后才进入CLOSED，也就是说耗死了网络中残留的数据包，保证新连接建立时历史数据包全都死亡了。而前面我们提到了，使用tcp_tw_reuse只需要TIME_W
