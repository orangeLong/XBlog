# iOS-interview
## 1.为什么说OC是动态语言
其对象和数据变量类型都是在运行时确定，而不是在编译时确定，如多态性，可以使用父类指针指向子类对象。可以使用runtime的特性动态的添加替换方法。
## 2.属性关键字
属性的实质就是setter getter方法和带下划线的成员变量。默认修饰关键字为atomic strong(assign) readwrite。对象分配在堆中，由开发人员管理内存，基本数据类型分配在栈中，由系统管理内存。所以可以用assign修饰基本数据类型不会造成野指针。assign、__unsafe_unretained、unowned(swift)基本相同，weak使用有代价，可以提升一点点性能。@dynmic，其setter和getter不会自动帮你生成，需要手动实现。@synthesize，自动生成setter和getter方法。创建的临时对象都是__Strong修饰的，会进行一次强引用。
## 3.Copy
copy一般用来修饰实现NSCopying协议的对象，实现copyWithZone和mutableCopyWithZone。不可变使用copy是浅拷贝，拷贝指针，可变使用copy是深拷贝，拷贝内容。可变不可变使用mutableCopy都是深拷贝。一般使用copy，不可变copy指针，可变copy对象，防止其他地方做的修改影响内容。
## 4.weak原理
weak表是一个hash表，key为所指对象的地址，value为weak指针的地址数组。  
①初始化weak对象时，runtime调用objc_initWeak()函数，判断类对象是否有效，否则直接返回。  
②添加引用时，调用objcStore_Weak()函数，更新指针指向，创建对应的弱引用表。  
③释放时，调用clearDeallocting()函数，先根据对象地址获取所有weak指针地址数组，然后遍历数组将其中数据置为nil，最后将删除entry，清理对象的记录。
## 5.IBOutlet修饰的UIView使用weak
使用xib或者storyboard创建的控件已经添加至父视图的subViews数组中，已经进行了强引用。自己创建的属性控件也可以使用weak修饰，但需要先创建临时变量进行强引用，然后再将该临时变量赋值给weak属性，否则会因为没有强引用直接释放。
## 6.nonatomic和atomic区别
非原子性，不安全效率高；原子性，安全，效率低。不是绝对安全，atomic只是在setter和getter中加了锁，如一个线程使用setter一个线程使用getter或直接使用下划线的成员变量就会导致问题。
## 7.进程和线程 同步和异步 并行和并发
进程：是具有一个独立功能的程序关于某个数据集合上的一次运行活动，进程是系统进行资源分配和调度的独立单位。  
线程：是进程的实体，是CPU调度和分派的基本单位，比进程更小的能独立运行的基本单位。线程自己基本不拥有系统资源，只拥有一点在运行中必不可少的资源（如程序计数器，一组寄存器和栈），它可与同属一个进程的其他线程共享所拥有的全部资源。  
同步：阻塞当前线程操作，不能开辟线程。  
异步：不阻碍线程继续操作，可以开辟线程来执行任务。  
并发：当有多个线程在操作时，如果一个系统只有一个CPU，就不可能同时进行一个以上的线程。CPU将运行时间划分为若干个时间段，然后分配给各个线程执行，在一个线程运行时，其他线程挂起。这种称为并发。  
并行：当拥有一个以上的CPU时，一个执行一个线程，一个执行另外一个线程，两个线程互不抢占CPU资源，同时进行。这种称为并行。
## 8.线程间通信
如使用GCD，可在主线程调用异步进入子线程并传递数据，可以在子线程调用主线程并传递数据。
## 9.GCD使用
可以使用Group队列组添加多个队列任务，并在最后监听notify判断多个队列任务全部完成。可以使用barrier栅栏先执行栅栏之前的任务，随后再执行栅栏之后的任务。
## 10.semaphore信号量
当信号量数字小于等于0时，阻塞线程。dispatch_semaphore_creat(1)创建信号量（需要大于等于0，否则返回NULL），dispatch_semaphore_wait(sem, time)信号量减1，dispatch_semaphore_signal(sem)信号量加1。
## 11.首次启动应用执行顺序
main函数之前  
dyld2是in-process，即在程序进程内执行，也就意味着应用启动时dyld2才能开始执行任务。  
iOS13全面使用dyld3，dyld3一部分为in-process，一部分是out-process，将分析Mach-o Headers、分析动态库依赖、查找Rebase&Bind之类的符号并写入缓存，应用启动时可以直接从缓存中读取数据，加快应用启动速度。out-process的动作在应用下载和版本更新的时候才会执行。
![dyld2 VS dyld3](./dyld.png)
1. 启动dynomic loader(dyld)到app进程--用于加载一个进程所需要的Image（Executable文件、Dylib动态库、Bundle无法被链接的动态库，只能通过dlopen()加载）Mach-O文件还包括Framework动态库与头文件及对应资源文件的集合
2. 加载动态库（包括所依赖的所有动态库）--dyld读取mach-o文件中的header和load commands，接下来就知道这个可执行文件依赖的动态库。|加载动态库A，然后检查A的依赖，进行递归加载，直到加载所有动态库。通常一个app有100-400的动态库，大多是系统的动态库，会缓存到dyld shared cache，读取速率较高。
3. Rebase和Bind--Rebase修正内部（指向当前mach-o文件）的指针指向，Bind修正外部指针指向。|因为ASLR，Address space layout randomization（地址空间布局随机化），应用启动时程序会被映射到逻辑的地址空间，这个逻辑的地址空间有个起始地址，而ASLR使这个地址随机。防止黑客通过起始地址+偏移量找到函数的地址。Rebase通过增加对应的偏移修正内部指针指向，Bind通过字符串匹配的方式查找符号表做修正，速度相对于Rebase较慢。 
4. 初始化Object C Runtime--在执行main函数之前需要把类的信息注册到全局的Table中，category信息也会注册到对应的类中，生成唯一的selector。iOS开发基于Cocoa Touch，大多数类都是系统类，所以大多数Runtime初始化在Rebase和Bind中已经完成。
5. 其他初始化代码（+load +initialize）--包括静态初始化对象  
main函数之后  
1. 执行main函数，argc为进入main函数时传参个数，默认为1；argv代表传入的参数，默认为程序名。
2. 执行UIApplicationMain方法传入代理类创建Application对象，并创建Delegate对象。
3. 创建并开启主循环，代理对象开始监听事件
4. 解析Info.plist，如果有Main.storyboard就创建Window对象并设置为Application的keyWindow，然后根据sb创建VC并设置为rootViewController。
5. 执行didFinishLaunchingWithOptions
## 12.NSCache优于NSDictionary的几点
1. 可以在内存不足时自动释放内存，线性删除最久未使用的对象 
2. 线程安全，可以在不同的线程用添加，删除和查询缓存中的对象 
3. key无需为实现NSCopying协议的对象，且NSCache不会自动拷贝key对象。
## 13.Designated Initializer
指定初始化函数，为NS_DESIGNATED_INITIALIZER的宏定义。子类如果有指定初始化函数，那么子类指定初始化函数实现时必须调用父类的指定初始化函数；子类如果有指定初始化函数，那么子类自定义的其他便利初始化函数必须调用自己的指定初始化函数或者其他便利初始化函数，不能直接调用父类的初始化函数。以保证整个子类初始化的过程中所有成员变量都得到有效的初始化。  
指定初始化函数才有资格调用父类的指定初始化函数。  
便利初始化函数只能调用自己类中的其他初始化方法。
## 14.description和debugDescription
类的实例方法，用来NSLog或者断点调试时的打印。
## 15.const static extern
1. const和宏：宏是预编译阶段处理，不做检查，只做单纯的替换。const是编译阶段，可以报编译错误。宏可以定义函数，但定义太多会增加编译时间。const只读，苹果推荐，放在什么之前修饰什么(int  const*a;*a不可变，int *const a;a不可变)。
2. static：修饰局部变量，将变量从栈拿到全局区，延长局部变量的生命周期，程序结束才会销毁；局部变量只会生成一份内存，只初始化一份；改变局部变量的作用域。修饰全局变量，只能在本文件中访问，修改全局变量的作用域，生命周期不变；避免重复定义全局变量。多次执行会先判读变量是否有分配空间，没有就初始化，否则就直接取全局值使用。
3. extern：用来获取全局变量，包括全局静态变量(const修饰)，不能用于定义变量。先在当前文件查找有没有全局变量，没有就去其他文件找。
## 16.inline
内联函数：为了解决频繁调用小函数大量消耗栈空间(栈内存)。适用于简单的函数调用，将函数调用换成函数内容，避免调用函数对栈内存重复开辟带来的消耗。不能在内联函数内部调用本身。inline仅仅是对编译器的建议，最后是否内联由编译器决定。
## 17.iOS内存分配
从栈到代码区，地址降低。  
1. 栈(stack)--先入后出，编译器自动分配释放，用于存放函数的参数值，局部变量等值。快速高效，但是数据不灵活。栈也分静态分配和动态分配，静态分配是编译器完成的，如自动变量(auto|默认为auto，static就是将其拿到全局区)的分配;动态分配由alloca函数来完成。栈的动态分配无需释放，没有释放函数。为了可移植的程序起见，栈的动态分配操作不被鼓励。
2. 堆(heap)--先入先出，由开发者分配和释放，程序结束后可由操作系统回收。灵活方便，数据适应面广泛，效率有一定降低。iOS中的alloc，c中的malloc(传入空间大小)，calloc(空间个数，空间大小=>返回一个数组)，realloc(重新开辟内存，传入另一个指针，空间大小)均是在堆中开辟内存。 
3. 全局区(静态区static)--全局变量(方法外部定义的变量)和静态变量(const修饰的变量)存储在一起，未初始化的全局变量和静态变量存放在BSS段(Block Stared by Symbol);初始化的全局变量和静态变量存放在data段。
4. 常量区--存放常量字符串，程序结束后由系统回收。
5. 代码区--存放函数的二进制代码。
## 18.Block
block的实质就是一个oc对象。有三种类型的block，__NSMallocBlock(堆)，__NSStackBlock(栈)，__NSGlobalBlock(全局)。当block中只访问全局或静态变量，则该blcok存放在全局区为全局block。当block内部访问局部变量(不管局部变量处于堆还是栈)，则该block存放在栈，为栈block。在ARC中，在对栈block赋值给修饰为strong或copy的属性时，会自动执行一次copy操作，将其从栈copy到堆中，为堆block。在MRC中，需要手动调用.copy将其从栈copy至堆区，所以在MRC中需要用copy来修饰block，在ARC中使用copy只是沿用了MRC的习惯，也可以使用strong来修饰block。
## 19.__block 
因为block中捕获的局部变量都是浅拷贝的新指针，对block内部的指针赋值不影响外部。__block生成了一个结构体block_byref包括所修饰的属性，block内部就可以使用该结构体修改属性的值。
## 20.block怎么捕获局部变量和block循环引用
block会生成一个结构体，该结构体会强引用内部包含的局部变量，成为结构体的一部分。如果a持有block，block生成的结构体中又持有了a后就会造成循环引用。
## 21.objc发送消息的调用顺序
方法调用会被编译器转成objc_msgSend。根据对象的isa指针找到类对象，在类对象的methodLists方法列表中找对应的方法，如果没有就通过对象的superClass找到父对象，重复上述过程直至找到函数IMP执行。方法调用之后就会方法名作为key，函数实现作为value保存在objc_cache中，方便下次调用。类方法会通过类结构体的isa指针找到元类，在元类的methodLists中找对应的函数IMP。
## 22.类的关系
子类实例isa指针指向类，类isa指针指向元类，元类的isa指针指向根元类，根元类isa指针指向自己。  
类的superClass指向父类，父类的superClass指向根类，根类的superClass指向nil。  
元类的superClass指向父元类，父元类的superClass指向根元类，根元类的superClass指向根类。  
![class](./class.png)
## 23.什么时候会报unrecognized selector错误
当调用方法不存在时报错崩溃，runtime给予了三次机会避免崩溃。
1. 动态方法解析：+ (BOOL)resolveInstanceMethod:(SEL)sel 或者 + (BOOL)resolveClassMethod:(SEL)sel，允许通过class_addMethod动态添加函数实现。
2. 备用接受者：- (id)forwardingTargetForSelector:(SEL)selector，允许返回新对象来接收该方法。
3. 完整消息转发：- (void)forwardInvocation:(NSInvocation *)anInvocation，允许对方法进行处理或者干脆不处理。首先需要实现- (NSMethodSignature *)methodSignatureForSelector:(SEL)aSelector方法返回方法签名，否则转发调用不执行。
如果以上三个方法均未实现，则会执行- (void)doesNotRecognizeSelector:(SEL)aSelector导致崩溃。
![unrecognized selector](./runtime.png)
## 24.runtime应用
1. 关联对象
2. 添加方法、替换方法(KVO的实现)
## 25.KVO的实现原理
当对实例A进行观察时，KVO会创建一个A的子类NSKVONotifying_A，并将A的isa指针指向NSKVONotifying_A类，然后修改属性的setter方法，在修改属性的时候调用observe(监听)方法和执行父类方法。
## 26.能否向编译后的类中增加实例变量？能否向运行时创建的类中添加实例变量？
1. 不能向编译后的类中增加实例变量：因为编译后的类已经注册在runtime中，结构体中的objc_ivar_list实例变量的链表和instance_size实例变量的内存大小已经确定，同时runtime会调用class_setIvarListLayout或class_setWeakIvarLayout来处理strong和weak引用，故不能向已存在的类中添加实例变量。
2. 可以向运行时创建的类中添加实例变量：调用class_addIvar函数，但需要在objc_allocateClassPair之后，objc_registerClassPair之前，原因同上。
## 27.给类添加一个属性后，在类的结构体那些元素会发生变化？
instance_size：实例的大小变化，objc_ivar_list *ivars：属性列表
## 28.runloop概念
一般一个线程只能执行一个任务，任务执行完成后线程就会退出。如果需要线程能够随时处理事件但不退出，就需要执行类似于doWhile的循环。
``` objectivec
funcation loop() {
    initialize();
    do {
        var message = get_next_message();
        process_message(message);
    } while (message != quit);
}
```
这种模型通常叫做Event Loop，这种关键点在于：如何管理事件\消息，如果让线程在没有处理消息时休眠以避免资源占用、在有消息时立刻被唤醒并处理事件。
Runloop就是一个对象，这个对象管理了其所需要处理的事件和消息，并提供了一个入口函数来执行Event Loop的逻辑。线程执行完这个函数后，就会在函数内部“接收消息->等待->处理”的循环中，直到循环结束(如传入quit消息)，函数返回。
OSX/iOS中提供了NSRunLoop和CFRunLoopRef两个对象：
1. CFRunLoopRef 是在 CoreFoundation 框架内的，它提供了纯 C 函数的 API，所有这些 API 都是线程安全的。
2. NSRunLoop 是基于 CFRunLoopRef 的封装，提供了面向对象的 API，但是这些 API 不是线程安全的。
## 29.runloop和线程的关系
线程和runloop是一一对应的，其映射关系保存在一个全局的Dictionary中。创建线程默认不会创建runloop，需要通过调用CFRunLoopGetMain() 和 CFRunLoopGetCurrent()来开启。runloop的创建发生在第一次获取时，在线程结束时销毁，你只能在子线程内部获取其runloop。主线程runloop默认开启，子线程默认不开启。
## 30.runloop相关类型介绍
CoreFunction中关于RunLoop有五个类：
1. CFRunLoopRef
``` objectivec
struct __CFRunLoop {
    CFMutableSetRef _commonModes;     // Set
    CFMutableSetRef _commonModeItems; // Set
    CFRunLoopModeRef _currentMode;    // Current Runloop Mode
    CFMutableSetRef _modes;           // Set
    ...
};
```
2. CFRunLoopModeRef
``` objectivec
struct __CFRunLoopMode {
    // Mode Name, 例如 @"kCFRunLoopDefaultMode"
    CFStringRef _name;
    CFMutableSetRef _sources0;    // Set
    CFMutableSetRef _sources1;    // Set
    CFMutableArrayRef _observers; // Array
    CFMutableArrayRef _timers;    // Array
    ...
};
```
3. CFRunLoopSourceRef
4. CFRunLoopTimerRef
5. CFRunLoopObserverRef
其中CFRunLoopModeRef未对外暴露，通过CFRunLoopRef的的接口进行了封装。
![runloop](./runloop.png)
Source/Timer/Observer 被统称为mode item，一个item可以被同时加入多个mode。但一个item被重复加入同一个mode时是不会有效果的。如果一个mode中一个item都没有，则RunLoop会直接退出，不进入循环。
一个 RunLoop 包含若干个 Mode，每个 Mode 又包含若干个 Source/ Timer/Observer。每次调用RunLoop的主函数时，只能指定其中一个Mode，这个Mode被称作CurrentMode。如果需要切换Mode，只能退出Loop，再重新指定一个Mode进入。这样做主要是为了分隔开不同组的Source/Timer/Observer，让其互不影响。
CFRunLoopSourceRef：是事件产生的地方，source有两个版本，source0和source1。source0只包含一个回调（函数指针），不能直接触发事件。使用时需要调用CFRunLoopSourceSignal(source)，将该source标记为待处理，然后手动调用CFRunLoopWakeUp(runloop)来唤醒RunLoop处理该事件。source1包含一个mach_port和一个回调（函数指针），被用于通过内核和其他线程相互发送消息。该source可以主动唤醒RunLoop线程。
CFRunLoopTimerRef：是基于时间的触发器，和NSTimer是toll-free bridge，可以混用。包含一个时间长度和一个回调（函数指针）。当其加入RunLoop，会注册对应的时间点，在时间点到时RunLoop被唤醒并执行回调。
CFRunLoopObserverRef：观察者，每个observer都包含了一个回调（函数指针），当RunLoop状态发生变化时，观察者通过RunLoop调用这些回调接收到这些变化，共有六种状态。
``` objectivec
typedef CF_OPTIONS(CFOptionFlags, CFRunLoopActivity) {
    kCFRunLoopEntry         = (1UL << 0), // 即将进入Loop
    kCFRunLoopBeforeTimers  = (1UL << 1), // 即将处理 Timer
    kCFRunLoopBeforeSources = (1UL << 2), // 即将处理 Source
    kCFRunLoopBeforeWaiting = (1UL << 5), // 即将进入休眠
    kCFRunLoopAfterWait     = (1UL << 6), // 刚从休眠中唤醒
    kCFRunLoopExit          = (1UL << 7), // 即将退出Loop
    kCFRunLoopAllActivities = 0x0FFFFFFFU // 均在活动
};
```
系统默认创建了五种Mode：
1. kCFRunLoopDefaultMode(NSDefaultRunLoopMode)：App的默认Mode，通常主线程在该Mode下运行。
2. UITrackingRunLoopMode：界面跟中Mode，用于ScrollView追踪触摸滑动，保证界面滑动不受其他Mode影响。
3. UIInitializationRunLoopMode：在应用刚启动时进入的第一个Mode，启动完成之后就不在使用
4. GSEventReceiveRunLoopMode：接收系统事件的内部Mode，通常用不到
5. kCFRunLoopCommonModes(NSRunLoopCommonModes)：伪模式，比较特殊
通常用到的有1、2、5三种。
有个比较特殊的概念“CommonModes”，一个Mode可以将自身标记为“Common”(通过将ModeName名添加至RunLoop中的“commonModes”)。每次RMunLoop的内容发生变化，RunLoop就会自动将_commonModeItems中的Source/Observer/Timer同步到具有"Common"标记的所有Mode里。
主线程中预制的两个Mode：kCFRunLoopDefaultMode和UITrackingRunLoopMode都已经被标记为“Common”属性。  
在主线程创建一个NSTimer会默认添加至DefaultMode，Timer可以得到重复回调，但此时滑动ScrollView时，RunLoop会默认把Mode切换为Tracking，此时Timer就不会被执行。  
一种办法是将这个Timer分别加入两个Mode:
``` objectivec
[[NSRunLoop currentRunLoop] addTimer:timer forMode:NSDefaultRunLoopMode];
[[NSRunLoop currentRunLoop] addTimer:timer forMode:UITrackingRunLoopMode];
```
另一种方法是将Timer加入顶层的“_commonModeItems”中，RunLoopMode切换时Timer将被自动更新到所有标记为“Common”的Mode中:
``` objectivec
[[NSRunLoop currentRunLoop] addTimer:timer forMode:NSRunLoopCommonModes];
```
使用scheduledTimerWithTimeInterval创建Timer会默认将该Timer加入DefaultMode下，等于：
``` objectivec
NSTimer *timer = [NSTimer timerWithTimeInterval:3 repeats:YES block:^(NSTimer * _Nonnull timer) {
    NSLog(@"1----%@----1", [[NSRunLoop currentRunLoop] currentMode]);
}];
[[NSRunLoop currentRunLoop] addTimer:timer forMode:NSDefaultRunLoopMode];
```
## 31.runloop原理
![runloops](./runloops.png)
每次开启RunLoop时，所在线程的RunLoop就会自动处理之前未处理的事件，并通知相关的观察者：
1. 通知Observer即将进入Loop
2. 通知Observer将要处理Timer
3. 通知Observer将要处理Source0
4. 处理Source0非基于端口的源
5. 如果有基于端口的源Source1准备好处于等待状态，进入步骤9
6. 通知Observer将要休眠
7. 将线程置于休眠等待外部
* 某一事件到达基于端口的源source0
* 定时器启动
* RunLoop设置的时间超时
* RunLoop被显示唤醒
8. 通知Observer线程被唤醒
9. 处理未处理的事件
* 如果用户定义的定时器启动，处理定时器事件并重启RunLoop。进入步骤二
* 如果输入源启动，传递相应的消息。
* 如果RunLoop被显示唤醒且时间未超时，重启RunLoop。进入步骤二
10. 通知Observer循环结束
## 32.runloop应用
1. NSTimer的使用
2. ImageView推迟显示：防止页面滑动的时候加载图片卡顿：
``` objectivec
[self.imageView performSelector:@selector(setImage:) withObject:[UIImage imageNamed:@"tupian"] afterDelay:4.0 inModes:NSDefaultRunLoopMode];
```
3.后台常驻线程：当后台操作比较频繁，经常在子线程做耗时操作(下载文件、播放音乐)，可以将线程常驻。
``` objectivec
NSThread *thread = [[NSThread alloc] initWithBlock:^{
NSLog(@"ssss---%@----%@", [NSRunLoop currentRunLoop], [NSThread currentThread]);
[[NSRunLoop currentRunLoop] addPort:[NSPort port] forMode:NSDefaultRunLoopMode];
[[NSRunLoop currentRunLoop] run];
NSLog(@"eeee");
}];
[thread start];

[self performSelector:@selector(doSomething) onThread:thread withObject:nil waitUntilDone:NO];
```
打印的日志“eeee”将永远不会执行。
## 33.NSTimer是否准确
正常情况下NSTimer是准确的，误差在1ms内，但容易被影响。
1. runloop的影响：
问题：定时器添加至主线程中，由于timer在runloop中被检测一次，如果这一次做了耗时的操作，当runloop持续的时间超过了定时器的间隔时间，那么下次定时就被延后。  
解决：可以在子线程中创建timer，然后在主线程或子线程处理后刷新UI
2. runloop模式影响：  
问题：定时器默认被加载在DefaultMode中，当ScrollView滑动的时候RunLoopMode被切换到Tracking时定时器将不被执行。  
解决：将Timer添加至TrackingMode下或添加至_commonModeItems下。

其他Timer：  
1. CADisplayLink，基于屏幕的刷新周期，一般很准确，60帧，但本质也是通过runloop，在CPU有负载时会造成延时。
2. GCD，dispatch_source_t类型，dispatch源监听系统内核对象并处理，通过系统级调用，更为准确。
3. mach_absolute_time()，通过CPU均匀变化的时钟周期数，将ticks数转换成秒或者纳秒来实现时间的计算。
## 34.@autoreleasepool
自动释放池，可以用来减少内存峰值。其实是一个对象，结构体，系统在main函数中调用了一个autoreleasepool，并在每个runloop中隐式的创建了一个。在构造函数时将其中的对象包裹起来，析构函数对其中的对象进行release操作。
使用场景：
1. 编写不是基于UI框架的程序，如命令行工具。
2. 在循环中使用了大量的局部对象，会在循环结束后释放。对Array或者Dictionary可以使用enumerate遍历，内部封装了autoreleasepool。
3. 长时间的后台任务等。
## 35.AutoreleasePool创建和销毁时机
APP启动时，系统在主线程的RunLoop添加了两个Observer：
1. 第一个Observer在RunLoop进入Entry(即将进入loop)时，其回调会调用_objc_autoreleasePoolPush() 创建自动释放池。其优先级最高，保证创建释放池发生在其他所有回调之前。
2. 第二个Observer在BeforWaiting(准备进入休眠)时调用_objc_autoreleasePoolPop() 和 _objc_autoreleasePoolPush()释放旧池并创建新池；在Exit(将要推出loop)时调用_objc_autoreleasePoolPop()释放池。这个Observer等级最低，保证释放池发生在所有回调之后。
## 36.objc中向nil对象发送消息发生什么、返回什么
在OC中发送消息均被转成objc_msgsend()，然后当obj为nil时直接返回并返回0。
## 37.+load和+initialize异同
+load:  
load是当类或分类加载至runtime中时被调用的，在调用main函数之前，主类、子类、分类均可以执行load。执行顺序主类>子类>分类(分类load调用顺序取决于编译顺序)。load中可以进行方法替换工作，不能做对象的初始化，因为无法判断对象是否已被加载；不能做耗时操作，增加启动时间。  
+initialize:  
initialize是在类或子类收到第一条消息之前调用的，如果该类被加载进来未使用则不会被调用。对子类发送消息会先调用父类的initialize方法。多个分类实现只会执行一个，调用Compile Sources中的最后一个。
## 38.矢量图(向量图)和位图(标量图、像素图、点阵图)
1. 矢量图相当于对图片的描述，通过记录图片的几何形状、线条粗细和色彩等来描述图片。矢量图只能表示有规律的线条组成的图形，如工程图等，无法描述无规则的像素点，如山水人物。放大缩小不会失真，所占空间小。
2. 位图描述每个像素的显示，所占空间较大，放大缩小会失真。
## 39.屏幕绘制原理
1. 水平同步、垂直同步：  
过去CRT显示器显示画面，需要电子枪从上到下一行行扫描，扫描完成之后显示器就会呈现一帧画面。完成一帧画面后，电子枪回到初始位置继续下一次扫描。当电子枪换到新的一行，准备进行扫描时，显示器会发出一个水平同步信号：HSync。当电子枪完成一帧画面的绘制，电子枪恢复到原位准备下一帧画面时，显示器会发出一个垂直同步信号：VSync。CRT、OLD和OLED成像原理不同，但都需要一定的刷新频率向GPU获取新的图像用于显示。显示器是固定频率，比如iOS显示器是每秒60帧，16.6秒完成一帧。
2. 工作原理：  
CPU将画面计算好bitmap交给GPU，GPU渲染完成后将渲染结果放入帧缓冲区(frame buffer)，随后视频控制器按照垂直同步信号逐行读取缓冲区的数据，经过可能的数模转换传递给显示器显示。
为了解决效率问题，显示系统一般会有两个缓冲区，GPU会预先渲染好一帧放入一个缓冲区，下一帧渲染完成之后，收到VSync，指针指向下一个缓冲区，防止画面撕裂。
![图像显示w原理](./CPU.png)
3. 卡顿原因：  
CPU主线程计算布局、解码图片、创建视图、绘制纹理，然后将计算好的内容交给GPU。
GPU混合纹理、顶点变换渲染到帧缓冲区。
如果16.6ms之内没有生产出一帧，这一帧将被丢弃，显示器就会保持不变，继续显示上一帧画面，造成卡顿。
4. CPU耗时操作：  
(1)AutoLayout: kuglerj做过实验，在复杂的页面，自动布局要比代码布局多花费50%，而且越复杂，子视图越多，时间差越大，近似指数增长。  
(2)文本计算:比如UILabel，文本是在主线程计算的  
(3)文本渲染:所有文本内容控件，包括UIWebView，排版和绘制都是在主线程进行，当现实大量文本时，CPU压力会很大  
(4)图片解码:当使用UIImage或CGImageSource的几个方法创建图片时，图片并不会立刻解码。图片在设置到UIImageView或CALayer.contents中，并在CALayer提交到GPU之前，CGImage中的数据才会解码。这一步发生在主线程，不可避免。  
(5)图像的绘制:生成bitmap  
5. GPU耗时操作：  
(1)纹理渲染:所有的bitmap，包括图片、文本、光栅化的内容，最终都要提交到显存，绑定为Texture。无论提交到显存的过程，还是GPU调整和渲染Texture的过程，都需要消耗不少GPU资源。在较短的时间内显示大量图片时，如tableview中含有多个图片并快速滑动，CPU占用率很低，但GPU占用率很高，页面仍然会掉帧。  
(2)视图的混合:多个视图混合在一起时，需要大量的GPU计算，应避免alpha通道。alpha<1就会计算下一层视图，增加资源消耗。  
(3):图像的生成:CALyer的圆角、阴影，遮罩都会触发离屏渲染，快速滑动CPU占用率少，GPU占用率高。可以开启光栅化，将离屏渲染转接到CPU。  
6. CPU优化:  
(1):文本的计算放到子线程，使用CoreText或TextKit进行绘制  
(2):图片解码放在子线程  
(3):cell中不要动态的添加addView，可以使用hidden  
(4):尽可能减少subViews的数量  
(5):避免重复计算，如缓存cell高度  
7. GPU优化:  
(1):尽量少用或不用透明图层，减少纹理的混合计算，确保UIImage没有alpha通道。  
(2):确保图片大小和frame一致，保证字节对其，不要在滑动时缩放图片，减少缩放消耗时间；确保png格式的图片颜色被GPU支持，避免CPU转换  
(3):Core Animation在图像资源非字节对其时渲染前会先拷贝一份图像数据，字节对其时不进行额外的计算；像素不对齐会合成纹理，消耗资源。  
(4):绝大多数离屏渲染会影响性能，设置圆角、阴影、模糊效果、光栅化都会导致离屏渲染。
## 40.离屏渲染
GPU屏幕渲染有两种方式：  
On-Screen Rendering，当期屏幕渲染，指的是GPU渲染操作在当前的屏幕缓冲区中进行。  
Out-Screen Rendering，离屏渲染，指的是在GPU当前的屏幕缓冲区以外新开辟一个缓冲区进行渲染操作。  
特殊的离屏渲染：CPU渲染。如果重写了drawReact方法，并且使用任何Core Graphics技术进行绘制，就涉及到CPU渲染。整个渲染过程由CPU在APP内同步完成，渲染得到的bitmap交由GUP显示。Core Graphics通常是线程安全的，所以可以进行异步绘制。
## 41.为什么使用离屏渲染
在使用圆角、阴影、遮罩的时候，图层属性的混合体被指定为在未预合成之前不能直接在屏幕中绘制，所以就需要屏幕外渲染被唤起。  
屏幕外渲染并不意味着软件绘制，但是它意味着图层必须在显示之前在一个屏幕外的上下文中被渲染（无论GPU或CPU）。  
所以在离屏渲染时很容易造成性能消耗，因为在OpenGL里离屏渲染会单独在内存中创建一个屏幕外缓冲区并进行渲染。而屏幕外缓冲区和当前屏幕缓冲区的上下文切换是很消耗性能的。
## 42.光栅化
layer.shouldRasterize，将图转换为一个个的栅格（像素）组成的图像。光栅化的特点：每个元素对应帧缓存区中的一像素。开启光栅化时，会将光栅化的内容缓存起来，如果对应的layer和subLayers没有变化，则在下一帧可以直接使用。灌水光光栅化可将layer(包括阴影遮罩等效果)缓存成位图，从而减少渲染的频度。相当于光栅化把GPU的操作转移到了CPU上，生成位图缓存，直接读取复用。   
注:对于经常变动的内容不要开启光栅化，否则容易引起性能浪费。如Cell的内容需要不断的变动重绘，使用光栅化会造成大量的离屏渲染，降低性能。
## 43.UIView和CALyer
UIView为CALayer提供内容，以及负责处理触摸事件，参与响应链。  
CALayer负责显示内容contents
## 44.事件传递和视图响应链
事件由屏幕触发-UIApplication-UIWindow-UIView-SubViews，然后再倒序传递，最下方的视图不处理就返回父视图，如果到UIApplication还不处理就抛掉。  
其中关键的两个方法：hitTest和pointInside  
当视图的hidden==YES、userInteractionEnabled==NO、alpha<0.01时不处理
## 45.UI绘制原理
![绘制流程](./draw.png)
调用view的setNeedsDisplay不会立即绘制，而是调用当前layer的setNeedsDispaly方法为layer打上标记，在runloop快要结束时调用layer的display方法来到真正的绘制流程。如果layer的delegate有值并实现了dispalyLayer方法，就会走异步绘制流程，否则走系统绘制流程。
![系统绘制](./systemDraw.png)
layer内部会创建一个backing store，可以理解为上下文。然后判断layer的delegate是否有值，如果没有执行[CALayer drawInContext:]，否则执行drawLayer方法，并在方法内部执行view的drawRect。最后将绘制完成的backing store提交给GPU。
![异步绘制](./asyncDraw.png)  
如果view实现了dispalyLayer方法，则可在方法内部执行异步绘制。可以使用Core Graphics的API进行绘制，并将绘制完成的image赋值给layer的contents。
YYAsyncLayer做了异步绘制的工作：  
1. 在主线程注册了一个observer，优先级比CATransaction低，保证系统完成必须的工作。
2. 将需要异步绘制的操作集中起来。比如设置字体/颜色/背景等，runloop会在observer需要的时机通知统一处理。
3. 处理时机到时，执行异步绘制，并在主线程中把绘制结果传递给layer的contents总完成绘制。
## 46.字符串反转
按字符串的长度除以2，并for循环交换前后的字符即可。
``` objectivec
NSMutableString *finalStr = @"hello,world".mutableCopy;
for (int i = 0; i < finalStr.length / 2; i++) {
    NSString *exchangeStr = [finalStr substringWithRange:NSMakeRange(i, 1)];
    [finalStr replaceCharactersInRange:NSMakeRange(i, 1) withString:[finalStr substringWithRange:NSMakeRange(finalStr.length - i - 1, 1)]];
    [finalStr replaceCharactersInRange:NSMakeRange(finalStr.length - i - 1, 1) withString:exchangeStr];
}

char *origin = "hello,moon";
unsigned long len = strlen(origin);
char change[len];
for (int i = 0; i < len / 2; i++) {
    char mid = origin[i];
    change[i] = origin[len - i - 1];
    change[len - i - 1] = mid;
}
```
## 47.反转链表
反转前：1->2->3->4->NULL
反转后：4->3->2->1->NULL
反转主要在于记录当前和next并传给下一次循环。
``` objectivec
typedef struct Node {
    long data;
    struct Node *next;
} Node;


- (Node *)constructList {
    Node *beigin = NULL;
    Node *end = NULL;
    for (int i = 0; i < 10; i++) {
        Node *node = malloc(sizeof(Node));
        node->data = i;
    if (beigin == NULL) {
            beigin = node;
        } else {
            end->next = node;
        }
        end = node;
    }
    return beigin;
}

- (Node *)reversalList:(Node *)node {
    Node *newNode = NULL;
    while (node != NULL) {
        Node *next = node->next;
        node->next = newNode;
        newNode = node;
        node = next;
    }
    return newNode;
}
```
## 48.有序数组的合并
只需要循环一次个数的总和
``` objectivec
- (void)orderListMerge
{
    int aLen = 5,bLen = 9;
    int a[] = {1,4,6,7,9};
    int b[] = {2,3,5,6,8,9,10,11,12};
    int result[14];
    int p = 0,q = 0,i = 0;//p和q分别为a和b的下标，i为合并结果数组的下标

    while (i < aLen + bLen) {
        if (p >= aLen) {
            result[i++] = b[q++];
        } else if (q >= bLen) {
            result[i++] = a[p++];
        } else {
            if (a[p] < b[q]) {
                result[i++] = a[p++];
            } else {
                result[i++] = b[q++];
            }
        }
    }
}
```
## 49.HASH算法
哈希表：给定值字母a，对应的ASCII码值为97，数组下标为97。这个ASCII码就是一种哈希函数，存储和查找都通过该函数，可以有效的提高查找效率。
在一个字符串中找到只出现一次的字符。字符char占有一个字节，在64位系统下一个字节有8位，最大255，有256中情况。
``` objectivec
char *testCh = "hhaabccdeef";
int list[256];
for (int i = 0; i < 256; i++) {
    list[i] = 0;
}
char *p = testCh;
char result = '\0'; // '\0就是nil'
while (*p != result) {
    // 将字符转成数字并将位置上的数字++
    list[*(p++)]++;
}

p = testCh;
while (*p != result) {
    if (list[*p] == 1) {
        result = *p;
        break;
    }
    p++;
}
```
## 50.查找两个子视图所有相同的父视图
从两个子视图最上层的父视图开始比较，直到找到第一个不同的，之前就是相同的。
``` objectivec
- (NSArray *)findCommonView:(NSArray *)views1 views2:(NSArray *)views2 {
    NSMutableArray *commons = @[].mutableCopy;
    for (int i = 0; i < MIN(views1.count, views2.count); i++) {
        UIView *super1 = views1[views1.count - 1 - i];
        UIView *super2 = views2[views2.count - 1 - i];
        if ([super1 isEqual:super2]) {
            [commons addObject:super1];
        } else {
            break;
        }
    }
    return commons;
}
```
## 51.二叉树
树：  
树是一种非线性的数据结构，相比较其他线性数据结构（链表、数组），树的平均运行时间短（往往跟树有关的排序时间复杂度都不会太高）。  
二叉树：  
树形结构中一般二叉树用的比较多。最上层为根节点，没有儿子的节点称为叶子，二叉树中每个节点不会超过两个儿子。一棵树至少有一个节点，就是根节点。节点的定义一般就是两个指针，一个数据，指针指向子节点或者null。  
遍历二叉树：  
    遍历二叉树有三种方式  
    先序遍历：先遍历根节点，然后访问左节点，最后访问右节点。根节点->左节点->右节点  
    中序遍历：先遍历左节点，然后访问根节点，最后访问右节点。左节点->根节点->右节点  
    后序遍历：先遍历左节点，然后访问右节点，最后访问根节点，左节点->右节点->根节点  
    不管那种遍历，访问有孩子的节点，先处理孩子。所以处理二叉树一般都使用递归，没有孩子了就返回。  
``` objectivec
typedef struct Node {
    struct Node* left;
    struct Node* right;
    int value;
} Node;

void traversalTree(Node *rootNode, int type) {
    if (!rootNode) {
        return;
    }
    if (type == 0) {
    //        先序遍历
        NSLog(@"%d", rootNode->value);
        traversalTree(rootNode->left, type);
        traversalTree(rootNode->right, type);
    } else if (type == 1) {
    //        中序遍历
        traversalTree(rootNode->left, type);
        NSLog(@"%d", rootNode->value);
        traversalTree(rootNode->right, type);
    } else {
    //        后序遍历
        traversalTree(rootNode->left, type);
        traversalTree(rootNode->right, type);
        NSLog(@"%d", rootNode->value);
    }
}
main {
    Node node1 = {NULL, NULL, 15};
    Node node2 = {NULL, NULL, 35};
    Node node3 = {&node1, &node2, 20};
    Node node4 = {NULL, NULL, 9};
    Node node5 = {&node4, &node3, 10};

    traversalTree(&node5, 0);
    traversalTree(&node5, 1);
    traversalTree(&node5, 2);
}
```
## 52.排序算法
排序有内部排序和外部排序，内部排序时数据记录在内存中进行排序，而外部排序是因排序的数据很大，一次不能容纳全部的排序记录，在排序过程中需要访问外存。八大排序都是内部排序。
graph TB;
    
``` 
                                          直接插入排序
                               插入排序---> 希尔排序
                               
                               选择排序---> 简单选择序
                                           堆排序
            （使用内存）                     
              内存排序      ---> 交换排序--->冒泡排序
排序--->                                   快速排序
         （内存和外存结合使用）     归并排序
              外存排序           基数排序
```
![排序](./sort.png)
![排序时间](./sorttime.png)
1. 直接插入排序
直接插入排序是一种最简单的排序方法，其基本操作是将一条记录插入到已排好的有序表中，从而得到一种新的记录量增1的有序表。
将序列的第一位看作有序表，从第二位开始如果比前面的小，就交换，直至前面的有序，然后下一次循环，直至整个序列有序。
``` objectivec
int a[8] = {8, 7, 2, 9, 12, 22, 1, 3};
int b = 8;
for (int i = 1; i < b; i++) {
    for (int j = i; j >= 1 && a[j - 1] > a[j]; j--) {
        int tmp = a[j];
        a[j] = a[j - 1];
        a[j - 1] = tmp;
    }
}
```
当初始序列为正序时，只需要外层循环n-1次，无需移动元素。比较次数Cmin=n-1，移动次数Mmin=0，时间复杂度为O(n)。
当初始序列为反序时，需要外循环n-1次，需要移动1到n-1次，每次都需要加上tmp的两次。此时时间复杂度为O(n²)。
2. 希尔排序
相对直接排序有较大的改进，又叫做缩小增量排序，是直接插入排序算法的一种更高效的改进版本。希尔版本是非稳定排序算法。
先取小于n的整数d1作为一个增量，以增量作为步长，跳跃式比较。如增量为5，则下标0、下标5、下标10的元素作为一组排序等，比较完成后再减小步长，直至步长为1，再进行最后一次插入排序完成排序。一般增量为前一个增量的一半。
``` objectivec
int a[8] = {8, 7, 2, 9, 12, 22, 1, 3};
int b = 8;
int l = b / 2;
while (b >= 1) {
    for (int i = l; i < b; i++) {
        for (int j = i; j >= l && a[j - l] > a[j]; j-=l) {
            int tmp = a[j];
            a[j] = a[j - l];
            a[j - l] = tmp;
        }
    }
    l = l / 2;
}
```
3. 简单选择排序
在排序的一组数中，选出最小或最大的一个与第一个位置的数交换；然后再剩下的数中找最小或最大的与第二个交换，以此类推，直到第n-1个元素和第n个元素比较为止。
``` objectivec
int a[8] = {8, 7, 2, 9, 12, 22, 1, 3};
int b = 8;

for (int i = 0; i < b - 1; i++) {
    int min = i;
    for (int j = i + 1; j < b; j++) {
        if (a[j] < a[min]) {
            min = j;
        }
    }
    if (i != min) {
        int tmp = a[i];
        a[i] = a[min];
        a[min] = tmp;
    }
}
```
4. 堆排序
堆排序是一种树形选择排序，是对直接选择排序的有效改进，利用数组的特点快速的定位指定索引的元素。堆分为大根堆和小根堆，是完全二叉树。
## 53.常见的Crach
1. 找不到方法 unrecognized selector sent to instance  
q:  
找不到对象的方法，且没做处理，详见23  
a:  
1.1 给NSObject添加分类，实现消息转发的三个方法  
1.2 避免使用performSelector系列方法  
1.3 调用delegate的方法前，判断respondsToSelector  
1.4 h文件中定义的方法在m文件中及时实现  
1.5 使用高版本api时要判断系统版本  
2. KVC造成的crash  
q:  
在key为nil，或名字为key的属性不存在且未重写setUndefinedKey方法时会导致崩溃  
a:  
可以重写setValue:ForUndefinedKey:方法，异常抛出
3. EXC_BAD_ACCESS   
该错误意味着访问一个不能执行该消息的内存，如已释放，或者野指针（指针悬挂）  
q:  
3.1 执行未实现的的block  
3.2 对象没初始化，如alloc之后未init  
3.3 访问的对象已经被释放（野指针），如用__unsafe_unretained关键字修饰的对象容易出现该问题；该用strong或weak修饰的用assign修饰了等  
a:  
3.1 对象及时初始化init  
3.2 没有完全把握不用使用__unsafe_unretained修饰属性，使用weak  
3.3 调用block时先对block进行判断  
3.4 出现问题时可以开启僵尸模式进行调试  
4. KVO引起的崩溃  
q:  
4.1 观察者或被观察者是局部变量，过了作用域被释放掉会导致not handled错误崩溃  
4.2 观察者没有实现observeValueForKeyPath方法会导致not handled错误崩溃  
4.3 重复移除观察者会导致not registered错误崩溃  
a:  
add和remove要成对出现，被观察者和观察者不要是局部变量
5. 集合类相关崩溃  
q:  
数组越界、添加nil(key or value)、多线程非原子性操作(未加锁)   
a:  
判断是否越界后执行对应方法，做非空判断，多线程加锁  
使用setValue:forKey:方法，value为nil时会删除键值对，不会崩溃  
可以使用category或runtime重写替换对应的方法，添加安全判断
6. 多线程崩溃  
q:  
6.1 子线程更新ui  
6.2 多线程操作同一个对象或数据  
a:  
6.1 子线程更新ui  
6.2 可以使用线程安全的NSCache  
7. watch dog（看门狗）超时造成的crash  
q: 主线程执行耗时操作，导致主线程被卡住超过一定时间就会崩溃，一般错误码是0x8badf00d，标识看门狗超时崩溃，通常是应用启动或终止花费太多时间、响应系统事件过久  
a: 应用启动的耗时操作交由子线程来操作，主线程只做更新ui和响应事件操作，网络请求或数据库读写放入子线程  
8. 后台返回NSNull对象
NULL: 用于表示普通数据类型的空，如NSInteger  
nil: 用于表示OC对象，对nil发送消息不会crash  
Nil: 用于Class类型对象的赋值（类也是对象，是元类的实例）  
NSNull: null对象，OC对象的占位  
q: 多见于java后台服务器开发语言返回null，会解析会NSNull对象，对NSNull对象进行方法操作就会有异常崩溃  
a: 判断null对象，NUllSafe  
## 54.KVC及KVC的寻找Key的顺序
KVC，key-value codeing,即调用setValueForKey：方法，其底层执行机制如下：
1. 程序优先调用set(Key):属性值的方法，代码通过setter方法设置。如key为@"name",则先调用setName:方法
2. 如果没找到就会检查是否重写+(BOOL)accessInstanceVariablesDirectly方法，默认返回YES，  
2.1 如果重写返回NO，则会直接执行setValue:forUndefinedKey:方法  
2.2 如果未重写或返回YES，则会寻找是否有下划线的成员变量，不管在h文件还是m文件中定义，只要能找到就会进行赋值。如_name
3. 如果没有setter方法，也没有下划线的成员变量（未重写accessInstanceVariablesDirectly成NO），就会找_is(Key)的成员变量。如_isName，_isname不行
4. 如果上面也没有就会找key或者is(Key)的成员变量，如name和isName
5. 以上均未实现系统会执行setValue:forUndefinedKey:方法。


## 39.
https://www.jianshu.com/p/d884f3040fda  
https://www.jianshu.com/p/78e083e4c7cb

