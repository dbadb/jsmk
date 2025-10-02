# compiling cefsimple

## produce primary .exe
```bash
make  -f tests/cefsimple/CMakeFiles/cefsimple.dir/build.make tests/cefsimple/CMakeFiles/cefsimple.dir/depend
cd build && cmake-E cmake_depends "Unix Makefiles" /Users/dana/.jsmk/frameworks/CEF/arm64-darwin/140 tests/cefsimple build build/tests/cefsimple build/tests/cefsimple/CMakeFiles/cefsimple.dir/DependInfo.cmake "--color="
make  -f tests/cefsimple/CMakeFiles/cefsimple.dir/build.make tests/cefsimple/CMakeFiles/cefsimple.dir/build
cd build/tests/cefsimple && /usr/bin/c++ -DCEF_USE_SANDBOX -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -I/Users/dana/.jsmk/frameworks/CEF/arm64-darwin/140 -O3 -DNDEBUG -arch arm64 -isysroot /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX15.5.sdk -mmacosx-version-min=12.0 -fno-strict-aliasing -fstack-protector -funwind-tables -fvisibility=hidden -Wall -Werror -Wextra -Wendif-labels -Wnewline-eof -Wno-missing-field-initializers -Wno-unused-parameter -mmacosx-version-min=12.0 -fobjc-arc -fno-exceptions -fno-rtti -fno-threadsafe-statics -fobjc-call-cxx-cdtors -fvisibility-inlines-hidden -std=c++17 -Wno-narrowing -Wsign-compare -Wno-undefined-var-template -O3 -MD -MT tests/cefsimple/CMakeFiles/cefsimple.dir/simple_app.cc.o -MF CMakeFiles/cefsimple.dir/simple_app.cc.o.d -o CMakeFiles/cefsimple.dir/simple_app.cc.o -c tests/cefsimple/simple_app.cc
cd build/tests/cefsimple && /usr/bin/c++ -DCEF_USE_SANDBOX -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -I/Users/dana/.jsmk/frameworks/CEF/arm64-darwin/140 -O3 -DNDEBUG -arch arm64 -isysroot /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX15.5.sdk -mmacosx-version-min=12.0 -fno-strict-aliasing -fstack-protector -funwind-tables -fvisibility=hidden -Wall -Werror -Wextra -Wendif-labels -Wnewline-eof -Wno-missing-field-initializers -Wno-unused-parameter -mmacosx-version-min=12.0 -fobjc-arc -fno-exceptions -fno-rtti -fno-threadsafe-statics -fobjc-call-cxx-cdtors -fvisibility-inlines-hidden -std=c++17 -Wno-narrowing -Wsign-compare -Wno-undefined-var-template -O3 -MD -MT tests/cefsimple/CMakeFiles/cefsimple.dir/simple_handler.cc.o -MF CMakeFiles/cefsimple.dir/simple_handler.cc.o.d -o CMakeFiles/cefsimple.dir/simple_handler.cc.o -c tests/cefsimple/simple_handler.cc
cd build/tests/cefsimple && /usr/bin/c++ -DCEF_USE_SANDBOX -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -I/Users/dana/.jsmk/frameworks/CEF/arm64-darwin/140 -O3 -DNDEBUG -arch arm64 -isysroot /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX15.5.sdk -mmacosx-version-min=12.0 -fno-strict-aliasing -fstack-protector -funwind-tables -fvisibility=hidden -Wall -Werror -Wextra -Wendif-labels -Wnewline-eof -Wno-missing-field-initializers -Wno-unused-parameter -mmacosx-version-min=12.0 -fobjc-arc -fno-exceptions -fno-rtti -fno-threadsafe-statics -fobjc-call-cxx-cdtors -fvisibility-inlines-hidden -std=c++17 -Wno-narrowing -Wsign-compare -Wno-undefined-var-template -O3 -MD -MT tests/cefsimple/CMakeFiles/cefsimple.dir/cefsimple_mac.mm.o -MF CMakeFiles/cefsimple.dir/cefsimple_mac.mm.o.d \
   -o CMakeFiles/cefsimple.dir/cefsimple_mac.mm.o \
   -c tests/cefsimple/cefsimple_mac.mm
cd build/tests/cefsimple && /usr/bin/c++ -DCEF_USE_SANDBOX -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS 
    -I/Users/dana/.jsmk/frameworks/CEF/arm64-darwin/140 -O3 -DNDEBUG -arch arm64 
    -isysroot /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX15.5.sdk 
    -mmacosx-version-min=12.0 -fno-strict-aliasing -fstack-protector -funwind-tables 
    -fvisibility=hidden -Wall -Werror -Wextra -Wendif-labels -Wnewline-eof 
    -Wno-missing-field-initializers -Wno-unused-parameter -mmacosx-version-min=12.0 
    -fobjc-arc -fno-exceptions -fno-rtti -fno-threadsafe-statics -fobjc-call-cxx-cdtors 
    -fvisibility-inlines-hidden -std=c++17 -Wno-narrowing -Wsign-compare 
    -Wno-undefined-var-template -O3 -MD -MT 
    tests/cefsimple/CMakeFiles/cefsimple.dir/simple_handler_mac.mm.o 
    -MF CMakeFiles/cefsimple.dir/simple_handler_mac.mm.o.d -o 
    CMakeFiles/cefsimple.dir/simple_handler_mac.mm.o 
    -c tests/cefsimple/simple_handler_mac.mm
/usr/bin/c++ -O3 -DNDEBUG -arch arm64 \
   -isysroot /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX15.5.sdk -mmacosx-version-min=12.0 \
   -Wl,-search_paths_first -Wl,-headerpad_max_install_names \
   -Wl,-search_paths_first -Wl,-ObjC -Wl,-pie -Wl,-dead_strip \
   CMakeFiles/cefsimple.dir/simple_app.cc.o \
   CMakeFiles/cefsimple.dir/simple_handler.cc.o \
   CMakeFiles/cefsimple.dir/cefsimple_mac.mm.o \
   CMakeFiles/cefsimple.dir/simple_handler_mac.mm.o \
   -o Release/cefsimple.app/Contents/MacOS/cefsimple  \
   ../../libcef_dll_wrapper/libcef_dll_wrapper.a \
   -lpthread -framework AppKit -framework Cocoa -framework IOSurface
cd build/tests/cefsimple && cmake-E copy_directory "Release/Chromium Embedded Framework.framework" "build/tests/cefsimple/Release/cefsimple.app/Contents/Frameworks/Chromium Embedded Framework.framework/Versions/A"
cd build/tests/cefsimple && cd "build/tests/cefsimple/Release/cefsimple.app/Contents/Frameworks/Chromium Embedded Framework.framework" && ln -sf "Versions/A/Chromium Embedded Framework" "Chromium Embedded Framework"
cd build/tests/cefsimple && cd "build/tests/cefsimple/Release/cefsimple.app/Contents/Frameworks/Chromium Embedded Framework.framework" && ln -sf Versions/A/Libraries Libraries
cd build/tests/cefsimple && cd "build/tests/cefsimple/Release/cefsimple.app/Contents/Frameworks/Chromium Embedded Framework.framework" && ln -sf Versions/A/Resources Resources
cd build/tests/cefsimple && cd "build/tests/cefsimple/Release/cefsimple.app/Contents/Frameworks/Chromium Embedded Framework.framework/Versions" && ln -sf A Current
cd build/tests/cefsimple && cmake-E copy_directory "build/tests/cefsimple/Release/cefsimple Helper.app" "build/tests/cefsimple/Release/cefsimple.app/Contents/Frameworks/cefsimple Helper.app"
cd build/tests/ceftests && /usr/bin/c++ -DCEF_USE_SANDBOX -DUNIT_TEST -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -I/Users/dana/.jsmk/frameworks/CEF/arm64-darwin/140 -O3 -DNDEBUG -arch arm64 -isysroot /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX15.5.sdk -mmacosx-version-min=12.0 -fno-strict-aliasing -fstack-protector -funwind-tables -fvisibility=hidden -Wall -Werror -Wextra -Wendif-labels -Wnewline-eof -Wno-missing-field-initializers -Wno-unused-parameter -mmacosx-version-min=12.0 -fobjc-arc -fno-exceptions -fno-rtti -fno-threadsafe-statics -fobjc-call-cxx-cdtors -fvisibility-inlines-hidden -std=c++17 -Wno-narrowing -Wsign-compare -Wno-undefined-var-template -O3 -MD -MT tests/ceftests/CMakeFiles/ceftests_Helper_alerts.dir/navigation_unittest.cc.o -MF CMakeFiles/ceftests_Helper_alerts.dir/navigation_unittest.cc.o.d -o CMakeFiles/ceftests_Helper_alerts.dir/navigation_unittest.cc.o -c tests/ceftests/navigation_unittest.cc
cd build/tests/cefsimple && cmake-E copy_directory "build/tests/cefsimple/Release/cefsimple Helper (Alerts).app" "build/tests/cefsimple/Release/cefsimple.app/Contents/Frameworks/cefsimple Helper (Alerts).app"
cd build/tests/cefsimple && cmake-E copy_directory "build/tests/cefsimple/Release/cefsimple Helper (GPU).app" "build/tests/cefsimple/Release/cefsimple.app/Contents/Frameworks/cefsimple Helper (GPU).app"
cd build/tests/cefsimple && cmake-E copy_directory "build/tests/cefsimple/Release/cefsimple Helper (Plugin).app" "build/tests/cefsimple/Release/cefsimple.app/Contents/Frameworks/cefsimple Helper (Plugin).app"
cd build/tests/ceftests && /usr/bin/c++ -DCEF_USE_SANDBOX -DUNIT_TEST -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -I/Users/dana/.jsmk/frameworks/CEF/arm64-darwin/140 -O3 -DNDEBUG -arch arm64 -isysroot /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX15.5.sdk -mmacosx-version-min=12.0 -fno-strict-aliasing -fstack-protector -funwind-tables -fvisibility=hidden -Wall -Werror -Wextra -Wendif-labels -Wnewline-eof -Wno-missing-field-initializers -Wno-unused-parameter -mmacosx-version-min=12.0 -fobjc-arc -fno-exceptions -fno-rtti -fno-threadsafe-statics -fobjc-call-cxx-cdtors -fvisibility-inlines-hidden -std=c++17 -Wno-narrowing -Wsign-compare -Wno-undefined-var-template -O3 -MD -MT tests/ceftests/CMakeFiles/ceftests_Helper_gpu.dir/message_router_unittest_utils.cc.o -MF CMakeFiles/ceftests_Helper_gpu.dir/message_router_unittest_utils.cc.o.d -o CMakeFiles/ceftests_Helper_gpu.dir/message_router_unittest_utils.cc.o -c tests/ceftests/message_router_unittest_utils.cc
cd build/tests/cefsimple && cmake-E copy_directory "build/tests/cefsimple/Release/cefsimple Helper (Renderer).app" "build/tests/cefsimple/Release/cefsimple.app/Contents/Frameworks/cefsimple Helper (Renderer).app"
cd build/tests/cefsimple && cmake-E copy tests/cefsimple/mac/Info.plist.in build/tests/cefsimple/Release/cefsimple.app/Contents/Resources/Info.plist.in
cd build/tests/cefsimple && cmake-E copy tests/cefsimple/mac/cefsimple.icns build/tests/cefsimple/Release/cefsimple.app/Contents/Resources/cefsimple.icns
cd build/tests/cefsimple && cmake-E copy tests/cefsimple/mac/English.lproj/InfoPlist.strings build/tests/cefsimple/Release/cefsimple.app/Contents/Resources/English.lproj/InfoPlist.strings
cd build/tests/cefsimple && cmake-E make_directory build/tests/cefsimple/Release/cefsimple.app/Contents/Resources/English.lproj
cd build/tests/cefsimple && /usr/bin/ibtool --output-format binary1 \
    --compile build/tests/cefsimple/Release/cefsimple.app/Contents/Resources/English.lproj/MainMenu.nib 
    tests/cefsimple/mac/English.lproj/MainMenu.xib
```

--------------------------------------------------------------------------
## produce several .exe, one for each helper.

```bash
/usr/bin/c++ -DCEF_USE_SANDBOX -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS \
    -I/Users/dana/.jsmk/frameworks/CEF/arm64-darwin/140 -O3 -DNDEBUG -arch arm64 \
    -isysroot /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX15.5.sdk \
    -mmacosx-version-min=12.0 -fno-strict-aliasing -fstack-protector -funwind-tables -fvisibility=hidden -Wall \
    -Werror -Wextra -Wendif-labels -Wnewline-eof -Wno-missing-field-initializers -Wno-unused-parameter -mmacosx-version-min=12.0 \
    -fobjc-arc -fno-exceptions -fno-rtti -fno-threadsafe-statics -fobjc-call-cxx-cdtors -fvisibility-inlines-hidden \
    -std=c++17 -Wno-narrowing -Wsign-compare -Wno-undefined-var-template -O3 -MD -MT \  
    tests/cefsimple/CMakeFiles/cefsimple_Helper_plugin.dir/process_helper_mac.cc.o \
    -MF CMakeFiles/cefsimple_Helper_plugin.dir/process_helper_mac.cc.o.d \
    -o CMakeFiles/cefsimple_Helper_plugin.dir/process_helper_mac.cc.o \
    -c tests/cefsimple/process_helper_mac.cc

/usr/bin/c++ -DCEF_USE_SANDBOX -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -I/Users/dana/.jsmk/frameworks/CEF/arm64-darwin/140 -O3 -DNDEBUG -arch arm64 -isysroot /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX15.5.sdk -mmacosx-version-min=12.0 -fno-strict-aliasing -fstack-protector -funwind-tables -fvisibility=hidden -Wall -Werror -Wextra -Wendif-labels -Wnewline-eof -Wno-missing-field-initializers -Wno-unused-parameter -mmacosx-version-min=12.0 -fobjc-arc -fno-exceptions -fno-rtti -fno-threadsafe-statics -fobjc-call-cxx-cdtors -fvisibility-inlines-hidden -std=c++17 -Wno-narrowing -Wsign-compare -Wno-undefined-var-template -O3 -MD -MT tests/cefsimple/CMakeFiles/cefsimple_Helper_renderer.dir/process_helper_mac.cc.o -MF CMakeFiles/cefsimple_Helper_renderer.dir/process_helper_mac.cc.o.d \
   -o CMakeFiles/cefsimple_Helper_renderer.dir/process_helper_mac.cc.o \
   -c tests/cefsimple/process_helper_mac.cc

/usr/bin/c++ -DCEF_USE_SANDBOX -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -I/Users/dana/.jsmk/frameworks/CEF/arm64-darwin/140 -O3 -DNDEBUG -arch arm64 -isysroot /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX15.5.sdk -mmacosx-version-min=12.0 -fno-strict-aliasing -fstack-protector -funwind-tables -fvisibility=hidden -Wall -Werror -Wextra -Wendif-labels -Wnewline-eof -Wno-missing-field-initializers -Wno-unused-parameter -mmacosx-version-min=12.0 -fobjc-arc -fno-exceptions -fno-rtti -fno-threadsafe-statics -fobjc-call-cxx-cdtors -fvisibility-inlines-hidden -std=c++17 -Wno-narrowing -Wsign-compare -Wno-undefined-var-template -O3 -MD -MT tests/cefsimple/CMakeFiles/cefsimple_Helper.dir/process_helper_mac.cc.o -MF CMakeFiles/cefsimple_Helper.dir/process_helper_mac.cc.o.d \
   -o CMakeFiles/cefsimple_Helper.dir/process_helper_mac.cc.o \
   -c tests/cefsimple/process_helper_mac.cc

/usr/bin/c++ -DCEF_USE_SANDBOX -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -I/Users/dana/.jsmk/frameworks/CEF/arm64-darwin/140 -O3 -DNDEBUG -arch arm64 -isysroot /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX15.5.sdk -mmacosx-version-min=12.0 -fno-strict-aliasing -fstack-protector -funwind-tables -fvisibility=hidden -Wall -Werror -Wextra -Wendif-labels -Wnewline-eof -Wno-missing-field-initializers -Wno-unused-parameter -mmacosx-version-min=12.0 -fobjc-arc -fno-exceptions -fno-rtti -fno-threadsafe-statics -fobjc-call-cxx-cdtors -fvisibility-inlines-hidden -std=c++17 -Wno-narrowing -Wsign-compare -Wno-undefined-var-template -O3 -MD -MT tests/cefsimple/CMakeFiles/cefsimple_Helper_gpu.dir/process_helper_mac.cc.o -MF CMakeFiles/cefsimple_Helper_gpu.dir/process_helper_mac.cc.o.d \
   -o CMakeFiles/cefsimple_Helper_gpu.dir/process_helper_mac.cc.o \
   -c tests/cefsimple/process_helper_mac.cc

/usr/bin/c++ -DCEF_USE_SANDBOX -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -I/Users/dana/.jsmk/frameworks/CEF/arm64-darwin/140 -O3 -DNDEBUG -arch arm64 -isysroot /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX15.5.sdk -mmacosx-version-min=12.0 -fno-strict-aliasing -fstack-protector -funwind-tables -fvisibility=hidden -Wall -Werror -Wextra -Wendif-labels -Wnewline-eof -Wno-missing-field-initializers -Wno-unused-parameter -mmacosx-version-min=12.0 -fobjc-arc -fno-exceptions -fno-rtti -fno-threadsafe-statics -fobjc-call-cxx-cdtors -fvisibility-inlines-hidden -std=c++17 -Wno-narrowing -Wsign-compare -Wno-undefined-var-template -O3 -MD -MT tests/cefsimple/CMakeFiles/cefsimple_Helper_alerts.dir/process_helper_mac.cc.o -MF CMakeFiles/cefsimple_Helper_alerts.dir/process_helper_mac.cc.o.d \
   -o CMakeFiles/cefsimple_Helper_alerts.dir/process_helper_mac.cc.o \
   -c tests/cefsimple/process_helper_mac.cc

cd build/tests/cefsimple && cmake-E cmake_link_script CMakeFiles/cefsimple_Helper_renderer.dir/link.txt --verbose=1
cd build/tests/cefsimple && cmake-E cmake_link_script CMakeFiles/cefsimple_Helper_plugin.dir/link.txt --verbose=1
cd build/tests/cefsimple && cmake-E cmake_link_script CMakeFiles/cefsimple_Helper_alerts.dir/link.txt --verbose=1
cd build/tests/cefsimple && cmake-E cmake_link_script CMakeFiles/cefsimple_Helper.dir/link.txt --verbose=1
cd build/tests/cefsimple && cmake-E cmake_link_script CMakeFiles/cefsimple_Helper_gpu.dir/link.txt --verbose=1
```make  -f tests/cefsimple/CMakeFiles/cefsimple_Helper_renderer.dir/build.make tests/cefsimple/CMakeFiles/cefsimple_Helper_renderer.dir/depend
make  -f tests/cefsimple/CMakeFiles/cefsimple_Helper.dir/build.make tests/cefsimple/CMakeFiles/cefsimple_Helper.dir/depend
make  -f tests/cefsimple/CMakeFiles/cefsimple_Helper_alerts.dir/build.make tests/cefsimple/CMakeFiles/cefsimple_Helper_alerts.dir/depend
make  -f tests/cefsimple/CMakeFiles/cefsimple_Helper_gpu.dir/build.make tests/cefsimple/CMakeFiles/cefsimple_Helper_gpu.dir/depend
make  -f tests/cefsimple/CMakeFiles/cefsimple_Helper_plugin.dir/build.make tests/cefsimple/CMakeFiles/cefsimple_Helper_plugin.dir/depend
cd build && cmake-E cmake_depends "Unix Makefiles" /Users/dana/.jsmk/frameworks/CEF/arm64-darwin/140 tests/cefsimple build build/tests/cefsimple build/tests/cefsimple/CMakeFiles/cefsimple_Helper_renderer.dir/DependInfo.cmake "--color="
cd build && cmake-E cmake_depends "Unix Makefiles" /Users/dana/.jsmk/frameworks/CEF/arm64-darwin/140 tests/cefsimple build build/tests/cefsimple build/tests/cefsimple/CMakeFiles/cefsimple_Helper.dir/DependInfo.cmake "--color="
cd build && cmake-E cmake_depends "Unix Makefiles" /Users/dana/.jsmk/frameworks/CEF/arm64-darwin/140 tests/cefsimple build build/tests/cefsimple build/tests/cefsimple/CMakeFiles/cefsimple_Helper_plugin.dir/DependInfo.cmake "--color="
cd build && cmake-E cmake_depends "Unix Makefiles" /Users/dana/.jsmk/frameworks/CEF/arm64-darwin/140 tests/cefsimple build build/tests/cefsimple build/tests/cefsimple/CMakeFiles/cefsimple_Helper_alerts.dir/DependInfo.cmake "--color="
cd build && cmake-E cmake_depends "Unix Makefiles" /Users/dana/.jsmk/frameworks/CEF/arm64-darwin/140 tests/cefsimple build build/tests/cefsimple build/tests/cefsimple/CMakeFiles/cefsimple_Helper_gpu.dir/DependInfo.cmake "--color="
make  -f tests/cefsimple/CMakeFiles/cefsimple_Helper_renderer.dir/build.make tests/cefsimple/CMakeFiles/cefsimple_Helper_renderer.dir/build
make  -f tests/cefsimple/CMakeFiles/cefsimple_Helper.dir/build.make tests/cefsimple/CMakeFiles/cefsimple_Helper.dir/build
make  -f tests/cefsimple/CMakeFiles/cefsimple_Helper_plugin.dir/build.make tests/cefsimple/CMakeFiles/cefsimple_Helper_plugin.dir/build
make  -f tests/cefsimple/CMakeFiles/cefsimple_Helper_alerts.dir/build.make tests/cefsimple/CMakeFiles/cefsimple_Helper_alerts.dir/build
make  -f tests/cefsimple/CMakeFiles/cefsimple_Helper_gpu.dir/build.make tests/cefsimple/CMakeFiles/cefsimple_Helper_gpu.dir/build
    tests/cefsimple/CMakeFiles/cefsimple_Helper_plugin.dir/process_helper_mac.cc.o \
    -MF CMakeFiles/cefsimple_Helper_plugin.dir/process_helper_mac.cc.o.d \
    -o CMakeFiles/cefsimple_Helper_plugin.dir/process_helper_mac.cc.o \
    -c tests/cefsimple/process_helper_mac.cc
/usr/bin/c++ -DCEF_USE_SANDBOX -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -I/Users/dana/.jsmk/frameworks/CEF/arm64-darwin/140 -O3 -DNDEBUG -arch arm64 -isysroot /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX15.5.sdk -mmacosx-version-min=12.0 -fno-strict-aliasing -fstack-protector -funwind-tables -fvisibility=hidden -Wall -Werror -Wextra -Wendif-labels -Wnewline-eof -Wno-missing-field-initializers -Wno-unused-parameter -mmacosx-version-min=12.0 -fobjc-arc -fno-exceptions -fno-rtti -fno-threadsafe-statics -fobjc-call-cxx-cdtors -fvisibility-inlines-hidden -std=c++17 -Wno-narrowing -Wsign-compare -Wno-undefined-var-template -O3 -MD -MT tests/cefsimple/CMakeFiles/cefsimple_Helper_renderer.dir/process_helper_mac.cc.o -MF CMakeFiles/cefsimple_Helper_renderer.dir/process_helper_mac.cc.o.d \
   -o CMakeFiles/cefsimple_Helper_renderer.dir/process_helper_mac.cc.o \
   -c tests/cefsimple/process_helper_mac.cc
/usr/bin/c++ -DCEF_USE_SANDBOX -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -I/Users/dana/.jsmk/frameworks/CEF/arm64-darwin/140 -O3 -DNDEBUG -arch arm64 -isysroot /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX15.5.sdk -mmacosx-version-min=12.0 -fno-strict-aliasing -fstack-protector -funwind-tables -fvisibility=hidden -Wall -Werror -Wextra -Wendif-labels -Wnewline-eof -Wno-missing-field-initializers -Wno-unused-parameter -mmacosx-version-min=12.0 -fobjc-arc -fno-exceptions -fno-rtti -fno-threadsafe-statics -fobjc-call-cxx-cdtors -fvisibility-inlines-hidden -std=c++17 -Wno-narrowing -Wsign-compare -Wno-undefined-var-template -O3 -MD -MT tests/cefsimple/CMakeFiles/cefsimple_Helper.dir/process_helper_mac.cc.o -MF CMakeFiles/cefsimple_Helper.dir/process_helper_mac.cc.o.d \
   -o CMakeFiles/cefsimple_Helper.dir/process_helper_mac.cc.o \
   -c tests/cefsimple/process_helper_mac.cc
/usr/bin/c++ -DCEF_USE_SANDBOX -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -I/Users/dana/.jsmk/frameworks/CEF/arm64-darwin/140 -O3 -DNDEBUG -arch arm64 -isysroot /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX15.5.sdk -mmacosx-version-min=12.0 -fno-strict-aliasing -fstack-protector -funwind-tables -fvisibility=hidden -Wall -Werror -Wextra -Wendif-labels -Wnewline-eof -Wno-missing-field-initializers -Wno-unused-parameter -mmacosx-version-min=12.0 -fobjc-arc -fno-exceptions -fno-rtti -fno-threadsafe-statics -fobjc-call-cxx-cdtors -fvisibility-inlines-hidden -std=c++17 -Wno-narrowing -Wsign-compare -Wno-undefined-var-template -O3 -MD -MT tests/cefsimple/CMakeFiles/cefsimple_Helper_gpu.dir/process_helper_mac.cc.o -MF CMakeFiles/cefsimple_Helper_gpu.dir/process_helper_mac.cc.o.d \
   -o CMakeFiles/cefsimple_Helper_gpu.dir/process_helper_mac.cc.o \
   -c tests/cefsimple/process_helper_mac.cc
/usr/bin/c++ -DCEF_USE_SANDBOX -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -I/Users/dana/.jsmk/frameworks/CEF/arm64-darwin/140 -O3 -DNDEBUG -arch arm64 -isysroot /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX15.5.sdk -mmacosx-version-min=12.0 -fno-strict-aliasing -fstack-protector -funwind-tables -fvisibility=hidden -Wall -Werror -Wextra -Wendif-labels -Wnewline-eof -Wno-missing-field-initializers -Wno-unused-parameter -mmacosx-version-min=12.0 -fobjc-arc -fno-exceptions -fno-rtti -fno-threadsafe-statics -fobjc-call-cxx-cdtors -fvisibility-inlines-hidden -std=c++17 -Wno-narrowing -Wsign-compare -Wno-undefined-var-template -O3 -MD -MT tests/cefsimple/CMakeFiles/cefsimple_Helper_alerts.dir/process_helper_mac.cc.o -MF CMakeFiles/cefsimple_Helper_alerts.dir/process_helper_mac.cc.o.d \
   -o CMakeFiles/cefsimple_Helper_alerts.dir/process_helper_mac.cc.o \
   -c tests/cefsimple/process_helper_mac.cc
cd build/tests/cefsimple && cmake-E cmake_link_script CMakeFiles/cefsimple_Helper_renderer.dir/link.txt --verbose=1
cd build/tests/cefsimple && cmake-E cmake_link_script CMakeFiles/cefsimple_Helper_plugin.dir/link.txt --verbose=1
cd build/tests/cefsimple && cmake-E cmake_link_script CMakeFiles/cefsimple_Helper_alerts.dir/link.txt --verbose=1
cd build/tests/cefsimple && cmake-E cmake_link_script CMakeFiles/cefsimple_Helper.dir/link.txt --verbose=1
cd build/tests/cefsimple && cmake-E cmake_link_script CMakeFiles/cefsimple_Helper_gpu.dir/link.txt --verbose=1
/usr/bin/c++ -O3 -DNDEBUG -arch arm64 -isysroot /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX15.5.sdk -mmacosx-version-min=12.0 -Wl,-search_paths_first -Wl,-headerpad_max_install_names -Wl,-search_paths_first -Wl,-ObjC -Wl,-pie -Wl,-dead_strip CMakeFiles/cefsimple_Helper_plugin.dir/process_helper_mac.cc.o -o "Release/cefsimple Helper (Plugin).app/Contents/MacOS/cefsimple Helper (Plugin)"  ../../libcef_dll_wrapper/libcef_dll_wrapper.a -lpthread -framework AppKit -framework Cocoa -framework IOSurface
/usr/bin/c++ -O3 -DNDEBUG -arch arm64 -isysroot /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX15.5.sdk -mmacosx-version-min=12.0 -Wl,-search_paths_first -Wl,-headerpad_max_install_names -Wl,-search_paths_first -Wl,-ObjC -Wl,-pie -Wl,-dead_strip CMakeFiles/cefsimple_Helper_alerts.dir/process_helper_mac.cc.o -o "Release/cefsimple Helper (Alerts).app/Contents/MacOS/cefsimple Helper (Alerts)"  ../../libcef_dll_wrapper/libcef_dll_wrapper.a -lpthread -framework AppKit -framework Cocoa -framework IOSurface
/usr/bin/c++ -O3 -DNDEBUG -arch arm64 -isysroot /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX15.5.sdk -mmacosx-version-min=12.0 -Wl,-search_paths_first -Wl,-headerpad_max_install_names -Wl,-search_paths_first -Wl,-ObjC -Wl,-pie -Wl,-dead_strip CMakeFiles/cefsimple_Helper.dir/process_helper_mac.cc.o -o "Release/cefsimple Helper.app/Contents/MacOS/cefsimple Helper"  ../../libcef_dll_wrapper/libcef_dll_wrapper.a -lpthread -framework AppKit -framework Cocoa -framework IOSurface
/usr/bin/c++ -O3 -DNDEBUG -arch arm64 -isysroot /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX15.5.sdk -mmacosx-version-min=12.0 -Wl,-search_paths_first -Wl,-headerpad_max_install_names -Wl,-search_paths_first -Wl,-ObjC -Wl,-pie -Wl,-dead_strip CMakeFiles/cefsimple_Helper_renderer.dir/process_helper_mac.cc.o -o "Release/cefsimple Helper (Renderer).app/Contents/MacOS/cefsimple Helper (Renderer)"  ../../libcef_dll_wrapper/libcef_dll_wrapper.a -lpthread -framework AppKit -framework Cocoa -framework IOSurface
/usr/bin/c++ -O3 -DNDEBUG -arch arm64 -isysroot /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX15.5.sdk -mmacosx-version-min=12.0 -Wl,-search_paths_first -Wl,-headerpad_max_install_names -Wl,-search_paths_first -Wl,-ObjC -Wl,-pie -Wl,-dead_strip CMakeFiles/cefsimple_Helper_gpu.dir/process_helper_mac.cc.o -o "Release/cefsimple Helper (GPU).app/Contents/MacOS/cefsimple Helper (GPU)"  ../../libcef_dll_wrapper/libcef_dll_wrapper.a -lpthread -framework AppKit -framework Cocoa -framework IOSurface
make  -f tests/cefsimple/CMakeFiles/cefsimple.dir/build.make tests/cefsimple/CMakeFiles/cefsimple.dir/depend
cd build && cmake-E cmake_depends "Unix Makefiles" /Users/dana/.jsmk/frameworks/CEF/arm64-darwin/140 tests/cefsimple build build/tests/cefsimple build/tests/cefsimple/CMakeFiles/cefsimple.dir/DependInfo.cmake "--color="
make  -f tests/cefsimple/CMakeFiles/cefsimple.dir/build.make tests/cefsimple/CMakeFiles/cefsimple.dir/build
cd build/tests/cefsimple && /usr/bin/c++ -DCEF_USE_SANDBOX -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -I/Users/dana/.jsmk/frameworks/CEF/arm64-darwin/140 -O3 -DNDEBUG -arch arm64 -isysroot /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX15.5.sdk -mmacosx-version-min=12.0 -fno-strict-aliasing -fstack-protector -funwind-tables -fvisibility=hidden -Wall -Werror -Wextra -Wendif-labels -Wnewline-eof -Wno-missing-field-initializers -Wno-unused-parameter -mmacosx-version-min=12.0 -fobjc-arc -fno-exceptions -fno-rtti -fno-threadsafe-statics -fobjc-call-cxx-cdtors -fvisibility-inlines-hidden -std=c++17 -Wno-narrowing -Wsign-compare -Wno-undefined-var-template -O3 -MD -MT tests/cefsimple/CMakeFiles/cefsimple.dir/simple_app.cc.o -MF CMakeFiles/cefsimple.dir/simple_app.cc.o.d -o CMakeFiles/cefsimple.dir/simple_app.cc.o -c tests/cefsimple/simple_app.cc
cd build/tests/cefsimple && /usr/bin/c++ -DCEF_USE_SANDBOX -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -I/Users/dana/.jsmk/frameworks/CEF/arm64-darwin/140 -O3 -DNDEBUG -arch arm64 -isysroot /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX15.5.sdk -mmacosx-version-min=12.0 -fno-strict-aliasing -fstack-protector -funwind-tables -fvisibility=hidden -Wall -Werror -Wextra -Wendif-labels -Wnewline-eof -Wno-missing-field-initializers -Wno-unused-parameter -mmacosx-version-min=12.0 -fobjc-arc -fno-exceptions -fno-rtti -fno-threadsafe-statics -fobjc-call-cxx-cdtors -fvisibility-inlines-hidden -std=c++17 -Wno-narrowing -Wsign-compare -Wno-undefined-var-template -O3 -MD -MT tests/cefsimple/CMakeFiles/cefsimple.dir/simple_handler.cc.o -MF CMakeFiles/cefsimple.dir/simple_handler.cc.o.d -o CMakeFiles/cefsimple.dir/simple_handler.cc.o -c tests/cefsimple/simple_handler.cc
cd build/tests/cefsimple && /usr/bin/c++ -DCEF_USE_SANDBOX -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -I/Users/dana/.jsmk/frameworks/CEF/arm64-darwin/140 -O3 -DNDEBUG -arch arm64 -isysroot /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX15.5.sdk -mmacosx-version-min=12.0 -fno-strict-aliasing -fstack-protector -funwind-tables -fvisibility=hidden -Wall -Werror -Wextra -Wendif-labels -Wnewline-eof -Wno-missing-field-initializers -Wno-unused-parameter -mmacosx-version-min=12.0 -fobjc-arc -fno-exceptions -fno-rtti -fno-threadsafe-statics -fobjc-call-cxx-cdtors -fvisibility-inlines-hidden -std=c++17 -Wno-narrowing -Wsign-compare -Wno-undefined-var-template -O3 -MD -MT tests/cefsimple/CMakeFiles/cefsimple.dir/cefsimple_mac.mm.o -MF CMakeFiles/cefsimple.dir/cefsimple_mac.mm.o.d \
   -o CMakeFiles/cefsimple.dir/cefsimple_mac.mm.o \
   -c tests/cefsimple/cefsimple_mac.mm
cd build/tests/cefsimple && /usr/bin/c++ -DCEF_USE_SANDBOX -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -I/Users/dana/.jsmk/frameworks/CEF/arm64-darwin/140 -O3 -DNDEBUG -arch arm64 -isysroot /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX15.5.sdk -mmacosx-version-min=12.0 -fno-strict-aliasing -fstack-protector -funwind-tables -fvisibility=hidden -Wall -Werror -Wextra -Wendif-labels -Wnewline-eof -Wno-missing-field-initializers -Wno-unused-parameter -mmacosx-version-min=12.0 -fobjc-arc -fno-exceptions -fno-rtti -fno-threadsafe-statics -fobjc-call-cxx-cdtors -fvisibility-inlines-hidden -std=c++17 -Wno-narrowing -Wsign-compare -Wno-undefined-var-template -O3 -MD -MT tests/cefsimple/CMakeFiles/cefsimple.dir/simple_handler_mac.mm.o -MF CMakeFiles/cefsimple.dir/simple_handler_mac.mm.o.d -o CMakeFiles/cefsimple.dir/simple_handler_mac.mm.o -c tests/cefsimple/simple_handler_mac.mm
cd build/tests/cefsimple && cmake-E cmake_link_script CMakeFiles/cefsimple.dir/link.txt --verbose=1
   CMakeFiles/cefsimple.dir/simple_app.cc.o \
   CMakeFiles/cefsimple.dir/simple_handler.cc.o \
   CMakeFiles/cefsimple.dir/cefsimple_mac.mm.o \
   CMakeFiles/cefsimple.dir/simple_handler_mac.mm.o \
   -o Release/cefsimple.app/Contents/MacOS/cefsimple  \
cd build/tests/cefsimple && cmake-E copy_directory "Release/Chromium Embedded Framework.framework" "build/tests/cefsimple/Release/cefsimple.app/Contents/Frameworks/Chromium Embedded Framework.framework/Versions/A"
cd build/tests/cefsimple && cd "build/tests/cefsimple/Release/cefsimple.app/Contents/Frameworks/Chromium Embedded Framework.framework" && ln -sf "Versions/A/Chromium Embedded Framework" "Chromium Embedded Framework"
cd build/tests/cefsimple && cd "build/tests/cefsimple/Release/cefsimple.app/Contents/Frameworks/Chromium Embedded Framework.framework" && ln -sf Versions/A/Libraries Libraries
cd build/tests/cefsimple && cd "build/tests/cefsimple/Release/cefsimple.app/Contents/Frameworks/Chromium Embedded Framework.framework" && ln -sf Versions/A/Resources Resources
cd build/tests/cefsimple && cd "build/tests/cefsimple/Release/cefsimple.app/Contents/Frameworks/Chromium Embedded Framework.framework/Versions" && ln -sf A Current
cd build/tests/cefsimple && cmake-E copy_directory "build/tests/cefsimple/Release/cefsimple Helper.app" "build/tests/cefsimple/Release/cefsimple.app/Contents/Frameworks/cefsimple Helper.app"
cd build/tests/cefsimple && cmake-E copy_directory "build/tests/cefsimple/Release/cefsimple Helper (Alerts).app" "build/tests/cefsimple/Release/cefsimple.app/Contents/Frameworks/cefsimple Helper (Alerts).app"
cd build/tests/cefsimple && cmake-E copy_directory "build/tests/cefsimple/Release/cefsimple Helper (GPU).app" "build/tests/cefsimple/Release/cefsimple.app/Contents/Frameworks/cefsimple Helper (GPU).app"
cd build/tests/cefsimple && cmake-E copy_directory "build/tests/cefsimple/Release/cefsimple Helper (Plugin).app" "build/tests/cefsimple/Release/cefsimple.app/Contents/Frameworks/cefsimple Helper (Plugin).app"
cd build/tests/cefsimple && cmake-E copy_directory "build/tests/cefsimple/Release/cefsimple Helper (Renderer).app" "build/tests/cefsimple/Release/cefsimple.app/Contents/Frameworks/cefsimple Helper (Renderer).app"
cd build/tests/cefsimple && cmake-E copy tests/cefsimple/mac/Info.plist.in build/tests/cefsimple/Release/cefsimple.app/Contents/Resources/Info.plist.in
cd build/tests/cefsimple && cmake-E copy tests/cefsimple/mac/cefsimple.icns build/tests/cefsimple/Release/cefsimple.app/Contents/Resources/cefsimple.icns
cd build/tests/cefsimple && cmake-E copy tests/cefsimple/mac/English.lproj/InfoPlist.strings build/tests/cefsimple/Release/cefsimple.app/Contents/Resources/English.lproj/InfoPlist.strings
cd build/tests/cefsimple && cmake-E make_directory build/tests/cefsimple/Release/cefsimple.app/Contents/Resources/English.lproj
cd build/tests/cefsimple && 
/usr/bin/ibtool --output-format binary1  \
    --compile build/tests/cefsimple/Release/cefsimple.app/Contents/Resources/English.lproj/MainMenu.nib \
    tests/cefsimple/mac/English.lproj/MainMenu.xib
