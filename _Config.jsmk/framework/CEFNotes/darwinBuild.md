# Darwin CEF build notes

- [Building an app](#building-an-app)
  - [Link the app](#link-the-app)
  - [Build Helper App (cefsimple), same for Helper\_gpu and Helper\_renderer.](#build-helper-app-cefsimple-same-for-helper_gpu-and-helper_renderer)
  - [Build Helper App (cefclient), more complex](#build-helper-app-cefclient-more-complex)
  - [Build Helper App (GPU)](#build-helper-app-gpu)
  - [App Install Layout](#app-install-layout)
  - [App Process Tree](#app-process-tree)
- [CEF build settings](#cef-build-settings)
  - [libcef\_dll\_wrapper](#libcef_dll_wrapper)
  - [SDKROOT](#sdkroot)
    - [How Xcode CLI Tools Define a Default `ISYSROOT` / `SDKROOT`](#how-xcode-cli-tools-define-a-default-isysroot--sdkroot)
    - [Key points](#key-points)
    - [How is this determined?](#how-is-this-determined)
    - [Checking the current default isysroot:](#checking-the-current-default-isysroot)

---

## Building an app

1. compile the CEF binding library.
2. compile libapp, our portable libDOMapp foundation.
3. produce the app (eg CEFHello) comprising several executables:
* `Contents/MacOS/cefsimple` (main is based on cefsimple_mac.mm)
* helpers (main is based on process_helper_mac):
    * `Frameworks/cefsimple Helper (Alerts).app/Contents/MacOS/cefsimple Helper (Alerts)`
    * `Frameworks/cefsimple Helper (GPU).app/Contents/MacOS/cefsimple Helper (GPU)`
    * `Frameworks/cefsimple Helper (Plugin).app/Contents/MacOS/cefsimple Helper (Plugin)`
    * `Frameworks/cefsimple Helper (Renderer).app/Contents/MacOS/cefsimple Helper (Renderer)`
    * `Frameworks/cefsimple Helper.app/Contents/MacOS/cefsimple Helper`

### Link the app

```sh
/usr/bin/c++ -O3 -DNDEBUG -arch arm64 \
    -isysroot /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX15.5.sdk \
    -mmacosx-version-min=12.0 \
    -Wl,-search_paths_first \
    -Wl,-headerpad_max_install_names \
    -Wl,-search_paths_first \
    -Wl,-ObjC \
    -Wl,-pie \
    -Wl,-dead_strip \
    CMakeFiles/cefsimple.dir/simple_app.cc.o \
    CMakeFiles/cefsimple.dir/simple_handler.cc.o \
    CMakeFiles/cefsimple.dir/cefsimple_mac.mm.o \
    CMakeFiles/cefsimple.dir/simple_handler_mac.mm.o \
    -o Release/cefsimple.app/Contents/MacOS/cefsimple  \
    ../../libcef_dll_wrapper/libcef_dll_wrapper.a \
    -lpthread -framework AppKit -framework Cocoa -framework IOSurface
```

### Build Helper App (cefsimple), same for Helper_gpu and Helper_renderer.

```
├── process_helper_mac.cc.o
```

### Build Helper App (cefclient), more complex

```
│----── shared
│       ├── common
│       │   ├── binary_value_utils.cc.o
│       │   ├── client_app.cc.o
│       │   ├── client_app_other.cc.o
│       │   ├── client_switches.cc.o
│       │   \── string_util.cc.o
│       ├── process_helper_mac.cc.o
│       └── renderer
│           \── client_app_renderer.cc.o
├── common
│   ├── client_app_delegates_common.cc.o
│   \── scheme_test_common.cc.o
└── renderer
    ├── client_app_delegates_renderer.cc.o
    ├── client_renderer.cc.o
    ├── ipc_performance_test.cc.o
    ├── performance_test.cc.o
    \── performance_test_tests.cc.o
```

NB (all helpers have the same files):

```sh
% find . -name \*render\*.cc.o
./cefclient_Helper_gpu.dir/__/shared/renderer/client_app_renderer.cc.o
./cefclient_Helper_gpu.dir/renderer/client_app_delegates_renderer.cc.o
./cefclient_Helper_gpu.dir/renderer/client_renderer.cc.o

./cefclient_Helper_plugin.dir/__/shared/renderer/client_app_renderer.cc.o
./cefclient_Helper_plugin.dir/renderer/client_app_delegates_renderer.cc.o
./cefclient_Helper_plugin.dir/renderer/client_renderer.cc.o

./cefclient_Helper.dir/__/shared/renderer/client_app_renderer.cc.o
./cefclient_Helper.dir/renderer/client_app_delegates_renderer.cc.o
./cefclient_Helper.dir/renderer/client_renderer.cc.o

./cefclient_Helper_alerts.dir/__/shared/renderer/client_app_renderer.cc.o
./cefclient_Helper_alerts.dir/renderer/client_app_delegates_renderer.cc.o
./cefclient_Helper_alerts.dir/renderer/client_renderer.cc.o

./cefclient_Helper_renderer.dir/__/shared/renderer/client_app_renderer.cc.o
./cefclient_Helper_renderer.dir/renderer/client_app_delegates_renderer.cc.o
./cefclient_Helper_renderer.dir/renderer/client_renderer.cc.o
```

### Build Helper App (GPU)

### App Install Layout
```sh
Contents
    ├── Frameworks
    │   ├── Chromium Embedded Framework.framework
    │   │   ├── Chromium Embedded Framework -> Versions/A/Chromium Embedded Framework

```sh
Contents
    ├── Frameworks
    │   ├── Chromium Embedded Framework.framework
    │   │   ├── Chromium Embedded Framework -> Versions/A/Chromium Embedded Framework
    │   │   ├── Libraries -> Versions/A/Libraries
    │   │   ├── Resources -> Versions/A/Resources
    │   │   └── Versions
    │   │       ├── A
    │   │       │   ├── Chromium Embedded Framework
    │   │       │   ├── Libraries
    │   │       │   │   ├── libEGL.dylib
    │   │       │   │   ├── libGLESv2.dylib
    │   │       │   │   ├── libcef_sandbox.dylib
    │   │       │   │   ├── libvk_swiftshader.dylib
    │   │       │   │   └── vk_swiftshader_icd.json
    │   │       │   └── Resources
    │   │       │       ├── Info.plist
    │   │       │       ├── af.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── af_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── af_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── af_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── am.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── am_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── am_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── am_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── ar.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── ar_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── ar_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── ar_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── bg.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── bg_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── bg_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── bg_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── bn.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── bn_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── bn_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── bn_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── ca.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── ca_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── ca_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── ca_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── chrome_100_percent.pak
    │   │       │       ├── chrome_200_percent.pak
    │   │       │       ├── cs.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── cs_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── cs_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── cs_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── da.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── da_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── da_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── da_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── de.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── de_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── de_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── de_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── el.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── el_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── el_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── el_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── en.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── en_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── en_GB.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── en_GB_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── en_GB_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── en_GB_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── en_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── en_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── es.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── es_419.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── es_419_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── es_419_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── es_419_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── es_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── es_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── es_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── et.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── et_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── et_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── et_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── fa.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── fa_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── fa_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── fa_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── fi.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── fi_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── fi_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── fi_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── fil.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── fil_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── fil_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── fil_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── fr.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── fr_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── fr_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── fr_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── gpu_shader_cache.bin
    │   │       │       ├── gu.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── gu_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── gu_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── gu_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── he.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── he_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── he_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── he_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── hi.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── hi_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── hi_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── hi_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── hr.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── hr_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── hr_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── hr_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── hu.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── hu_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── hu_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── hu_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── icudtl.dat
    │   │       │       ├── id.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── id_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── id_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── id_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── it.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── it_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── it_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── it_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── ja.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── ja_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── ja_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── ja_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── kn.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── kn_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── kn_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── kn_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── ko.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── ko_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── ko_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── ko_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── lt.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── lt_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── lt_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── lt_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── lv.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── lv_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── lv_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── lv_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── ml.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── ml_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── ml_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── ml_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── mr.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── mr_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── mr_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── mr_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── ms.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── ms_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── ms_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── ms_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── nb.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── nb_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── nb_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── nb_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── nl.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── nl_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── nl_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── nl_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── pl.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── pl_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── pl_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── pl_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── pt_BR.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── pt_BR_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── pt_BR_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── pt_BR_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── pt_PT.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── pt_PT_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── pt_PT_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── pt_PT_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── resources.pak
    │   │       │       ├── ro.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── ro_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── ro_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── ro_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── ru.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── ru_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── ru_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── ru_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── sk.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── sk_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── sk_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── sk_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── sl.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── sl_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── sl_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── sl_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── sr.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── sr_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── sr_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── sr_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── sv.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── sv_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── sv_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── sv_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── sw.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── sw_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── sw_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── sw_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── ta.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── ta_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── ta_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── ta_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── te.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── te_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── te_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── te_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── th.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── th_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── th_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── th_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── tr.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── tr_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── tr_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── tr_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── uk.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── uk_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── uk_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── uk_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── ur.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── ur_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── ur_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── ur_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── v8_context_snapshot.arm64.bin
    │   │       │       ├── vi.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── vi_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── vi_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── vi_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── zh_CN.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── zh_CN_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── zh_CN_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── zh_CN_NEUTER.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── zh_TW.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── zh_TW_FEMININE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       ├── zh_TW_MASCULINE.lproj
    │   │       │       │   └── locale.pak
    │   │       │       └── zh_TW_NEUTER.lproj
    │   │       │           └── locale.pak
    │   │       └── Current -> A
    │   ├── cefsimple Helper (Alerts).app
    │   │   └── Contents
    │   │       ├── Info.plist
    │   │       └── MacOS
    │   │           └── cefsimple Helper (Alerts)
    │   ├── cefsimple Helper (GPU).app
    │   │   └── Contents
    │   │       ├── Info.plist
    │   │       └── MacOS
    │   │           └── cefsimple Helper (GPU)
    │   ├── cefsimple Helper (Plugin).app
    │   │   └── Contents
    │   │       ├── Info.plist
    │   │       └── MacOS
    │   │           └── cefsimple Helper (Plugin)
    │   ├── cefsimple Helper (Renderer).app
    │   │   └── Contents
    │   │       ├── Info.plist
    │   │       └── MacOS
    │   │           └── cefsimple Helper (Renderer)
    │   └── cefsimple Helper.app
    │       └── Contents
    │           ├── Info.plist
    │           └── MacOS
    │               └── cefsimple Helper
    ├── Info.plist
    ├── MacOS
    │   └── cefsimple
    └── Resources
        ├── English.lproj
        │   ├── InfoPlist.strings
        │   └── MainMenu.nib
        │       ├── keyedobjects-101300.nib
        │       └── keyedobjects.nib
        ├── Info.plist.in
        └── cefsimple.icns
```

### App Process Tree

`cefsimple at startup (6 processes, 2 renderer, 2 util)`
```bash
 |-+= 45567 dana cefsimple.app/Contents/MacOS/cefsimple
 | |--- 45654 dana cefsimple.app/Contents/Frameworks/cefsimple Helper (GPU).app/Contents/MacOS/cefsimple Helper (GPU) --type=gpu-process --start-stack-profiler --user-data-dir=/Users/dana/Library/Application Support/CEF/User Data --gpu-preferences=SAAAAAAAAAAgAAAIAAAAAAAAAAAAAGAAAwAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAABAAAAAAAAAACAAAAAAAAAAIAAAAAAAAAA== --shared-files --metrics-shmem-handle=1752395122,r,1781639016494885274,13233963511437460739,262144 --field-trial-handle=1718379636,r,4579126650178195282,16325992737309105347,262144 --variations-seed-version --seatbelt-client=26
 | |--- 45655 dana cefsimple.app/Contents/Frameworks/cefsimple Helper.app/Contents/MacOS/cefsimple Helper --type=utility --utility-sub-type=network.mojom.NetworkService --lang=en-US --service-sandbox-type=network --start-stack-profiler --user-data-dir=/Users/dana/Library/Application Support/CEF/User Data --shared-files --metrics-shmem-handle=1752395122,r,10295410780217478882,5546332952949069339,524288 --field-trial-handle=1718379636,r,4579126650178195282,16325992737309105347,262144 --variations-seed-version --seatbelt-client=26
 | |--- 45657 dana cefsimple.app/Contents/Frameworks/cefsimple Helper.app/Contents/MacOS/cefsimple Helper --type=utility --utility-sub-type=storage.mojom.StorageService --lang=en-US --service-sandbox-type=service --user-data-dir=/Users/dana/Library/Application Support/CEF/User Data --shared-files --metrics-shmem-handle=1752395122,r,1380698774169641945,9788242130112193807,524288 --field-trial-handle=1718379636,r,4579126650178195282,16325992737309105347,262144 --variations-seed-version --seatbelt-client=48
 | |--- 45660 dana cefsimple.app/Contents/Frameworks/cefsimple Helper (Renderer).app/Contents/MacOS/cefsimple Helper (Renderer) --type=renderer --user-data-dir=/Users/dana/Library/Application Support/CEF/User Data --lang=en-US --num-raster-threads=4 --enable-zero-copy --enable-gpu-memory-buffer-compositor-resources --enable-main-frame-before-activation --renderer-client-id=7 --time-ticks-at-unix-epoch=-1758533492691975 --launch-time-ticks=34232565653 --shared-files --metrics-shmem-handle=1752395122,r,15983182755520697565,12994004660547029495,2097152 --field-trial-handle=1718379636,r,4579126650178195282,16325992737309105347,262144 --variations-seed-version --seatbelt-client=68
 | \--- 45662 dana cefsimple.app/Contents/Frameworks/cefsimple Helper (Renderer).app/Contents/MacOS/cefsimple Helper (Renderer) --type=renderer --start-stack-profiler --user-data-dir=/Users/dana/Library/Application Support/CEF/User Data --lang=en-US --num-raster-threads=4 --enable-zero-copy --enable-gpu-memory-buffer-compositor-resources --enable-main-frame-before-activation --renderer-client-id=8 --time-ticks-at-unix-epoch=-1758533492691975 --launch-time-ticks=34232882202 --shared-files --metrics-shmem-handle=1752395122,r,7735730535257106895,12435299519459600790,2097152 --field-trial-handle=1718379636,r,4579126650178195282,16325992737309105347,262144 --variations-seed-version --seatbelt-client=91
 ```

`cefsimple with one browser instance, after nav (7 processes, 2 renderer, 3 util)`
```bash
 |-+= 44722 dana cefsimple.app/Contents/MacOS/cefsimple
 | |--- 44809 dana cefsimple.app/Contents/Frameworks/cefsimple Helper (GPU).app/Contents/MacOS/cefsimple Helper (GPU) --type=gpu-process --start-stack-profiler --user-data-dir=/Users/dana/Library/Application Support/CEF/User Data --gpu-preferences=SAAAAAAAAAAgAAAIAAAAAAAAAAAAAGAAAwAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAABAAAAAAAAAACAAAAAAAAAAIAAAAAAAAAA== --shared-files --metrics-shmem-handle=1752395122,r,6461036528252033966,12617619210463706775,262144 --field-trial-handle=1718379636,r,6722945083820550807,9987264297747167920,262144 --variations-seed-version --seatbelt-client=31
 | |--- 44810 dana cefsimple.app/Contents/Frameworks/cefsimple Helper.app/Contents/MacOS/cefsimple Helper --type=utility --utility-sub-type=network.mojom.NetworkService --lang=en-US --service-sandbox-type=network --start-stack-profiler --user-data-dir=/Users/dana/Library/Application Support/CEF/User Data --shared-files --metrics-shmem-handle=1752395122,r,16511646521566645003,4943001955483124235,524288 --field-trial-handle=1718379636,r,6722945083820550807,9987264297747167920,262144 --variations-seed-version --seatbelt-client=31
 | |--- 44812 dana cefsimple.app/Contents/Frameworks/cefsimple Helper.app/Contents/MacOS/cefsimple Helper --type=utility --utility-sub-type=storage.mojom.StorageService --lang=en-US --service-sandbox-type=service --user-data-dir=/Users/dana/Library/Application Support/CEF/User Data --shared-files --metrics-shmem-handle=1752395122,r,1718879639247668702,10083756969614715500,524288 --field-trial-handle=1718379636,r,6722945083820550807,9987264297747167920,262144 --variations-seed-version --seatbelt-client=48
 | |--- 44822 dana cefsimple.app/Contents/Frameworks/cefsimple Helper (Renderer).app/Contents/MacOS/cefsimple Helper (Renderer) --type=renderer --user-data-dir=/Users/dana/Library/Application Support/CEF/User Data --lang=en-US --num-raster-threads=4 --enable-zero-copy --enable-gpu-memory-buffer-compositor-resources --enable-main-frame-before-activation --renderer-client-id=7 --time-ticks-at-unix-epoch=-1758533492687924 --launch-time-ticks=33595237666 --shared-files --metrics-shmem-handle=1752395122,r,14777197833792804241,12197737340559365339,2097152 --field-trial-handle=1718379636,r,6722945083820550807,9987264297747167920,262144 --variations-seed-version --seatbelt-client=68
 | |--- 45186 dana cefsimple.app/Contents/Frameworks/cefsimple Helper.app/Contents/MacOS/cefsimple Helper --type=utility --utility-sub-type=on_device_model.mojom.OnDeviceModelService --lang=en-US --service-sandbox-type=on_device_model_execution --user-data-dir=/Users/dana/Library/Application Support/CEF/User Data --shared-files --metrics-shmem-handle=1752395122,r,6906631039829822716,11438707986129838444,524288 --field-trial-handle=1718379636,r,6722945083820550807,9987264297747167920,262144 --variations-seed-version --seatbelt-client=117
 | \--- 45200 dana cefsimple.app/Contents/Frameworks/cefsimple Helper (Renderer).app/Contents/MacOS/cefsimple Helper (Renderer) --type=renderer --user-data-dir=/Users/dana/Library/Application Support/CEF/User Data --lang=en-US --num-raster-threads=4 --enable-zero-copy --enable-gpu-memory-buffer-compositor-resources --enable-main-frame-before-activation --renderer-client-id=11 --time-ticks-at-unix-epoch=-1758533492687924 --launch-time-ticks=33883622610 --shared-files --metrics-shmem-handle=1752395122,r,4588702078139195604,4969942301112505530,2097152 --field-trial-handle=1718379636,r,6722945083820550807,9987264297747167920,262144 --variations-seed-version --seatbelt-client=118
 ```

`cefsimple with two browser windows (8 processes, 3 renderer, 3 util)`
```bash
 |-+= 44722 dana cefsimple.app/Contents/MacOS/cefsimple
 | |--- 44809 dana cefsimple.app/Contents/Frameworks/cefsimple Helper (GPU).app/Contents/MacOS/cefsimple Helper (GPU) --type=gpu-process --start-stack-profiler --user-data-dir=/Users/dana/Library/Application Support/CEF/User Data --gpu-preferences=SAAAAAAAAAAgAAAIAAAAAAAAAAAAAGAAAwAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAABAAAAAAAAAACAAAAAAAAAAIAAAAAAAAAA== --shared-files --metrics-shmem-handle=1752395122,r,6461036528252033966,12617619210463706775,262144 --field-trial-handle=1718379636,r,6722945083820550807,9987264297747167920,262144 --variations-seed-version --seatbelt-client=31
 | |--- 44810 dana cefsimple.app/Contents/Frameworks/cefsimple Helper.app/Contents/MacOS/cefsimple Helper --type=utility --utility-sub-type=network.mojom.NetworkService --lang=en-US --service-sandbox-type=network --start-stack-profiler --user-data-dir=/Users/dana/Library/Application Support/CEF/User Data --shared-files --metrics-shmem-handle=1752395122,r,16511646521566645003,4943001955483124235,524288 --field-trial-handle=1718379636,r,6722945083820550807,9987264297747167920,262144 --variations-seed-version --seatbelt-client=31
 | |--- 44812 dana cefsimple.app/Contents/Frameworks/cefsimple Helper.app/Contents/MacOS/cefsimple Helper --type=utility --utility-sub-type=storage.mojom.StorageService --lang=en-US --service-sandbox-type=service --user-data-dir=/Users/dana/Library/Application Support/CEF/User Data --shared-files --metrics-shmem-handle=1752395122,r,1718879639247668702,10083756969614715500,524288 --field-trial-handle=1718379636,r,6722945083820550807,9987264297747167920,262144 --variations-seed-version --seatbelt-client=48
 | |--- 44822 dana cefsimple.app/Contents/Frameworks/cefsimple Helper (Renderer).app/Contents/MacOS/cefsimple Helper (Renderer) --type=renderer --user-data-dir=/Users/dana/Library/Application Support/CEF/User Data --lang=en-US --num-raster-threads=4 --enable-zero-copy --enable-gpu-memory-buffer-compositor-resources --enable-main-frame-before-activation --renderer-client-id=7 --time-ticks-at-unix-epoch=-1758533492687924 --launch-time-ticks=33595237666 --shared-files --metrics-shmem-handle=1752395122,r,14777197833792804241,12197737340559365339,2097152 --field-trial-handle=1718379636,r,6722945083820550807,9987264297747167920,262144 --variations-seed-version --seatbelt-client=68
 | |--- 45186 dana cefsimple.app/Contents/Frameworks/cefsimple Helper.app/Contents/MacOS/cefsimple Helper --type=utility --utility-sub-type=on_device_model.mojom.OnDeviceModelService --lang=en-US --service-sandbox-type=on_device_model_execution --user-data-dir=/Users/dana/Library/Application Support/CEF/User Data --shared-files --metrics-shmem-handle=1752395122,r,6906631039829822716,11438707986129838444,524288 --field-trial-handle=1718379636,r,6722945083820550807,9987264297747167920,262144 --variations-seed-version --seatbelt-client=117
 | |--- 45199 dana cefsimple.app/Contents/Frameworks/cefsimple Helper (Renderer).app/Contents/MacOS/cefsimple Helper (Renderer) --type=renderer --user-data-dir=/Users/dana/Library/Application Support/CEF/User Data --lang=en-US --num-raster-threads=4 --enable-zero-copy --enable-gpu-memory-buffer-compositor-resources --enable-main-frame-before-activation --renderer-client-id=10 --time-ticks-at-unix-epoch=-1758533492687924 --launch-time-ticks=33883208087 --shared-files --metrics-shmem-handle=1752395122,r,17003251058874611857,18158887193220093240,2097152 --field-trial-handle=1718379636,r,6722945083820550807,9987264297747167920,262144 --variations-seed-version --seatbelt-client=118
 | \--- 45200 dana cefsimple.app/Contents/Frameworks/cefsimple Helper (Renderer).app/Contents/MacOS/cefsimple Helper (Renderer) --type=renderer --user-data-dir=/Users/dana/Library/Application Support/CEF/User Data --lang=en-US --num-raster-threads=4 --enable-zero-copy --enable-gpu-memory-buffer-compositor-resources --enable-main-frame-before-activation --renderer-client-id=11 --time-ticks-at-unix-epoch=-1758533492687924 --launch-time-ticks=33883622610 --shared-files --metrics-shmem-handle=1752395122,r,4588702078139195604,4969942301112505530,2097152 --field-trial-handle=1718379636,r,6722945083820550807,9987264297747167920,262144 --variations-seed-version --seatbelt-client=118
 ```

## CEF build settings

```bash
cmake .. # produces make files
make -j8 VERBOSE=1 2>&1 | tee build.log
```

```bash
clang++ -DCEF_USE_SANDBOX -DWRAPPING_CEF_SHARED -D__STDC_CONSTANT_MACROS \
   -D__STDC_FORMAT_MACROS -I~/.jsmk/frameworks/CEF/arm64-darwin/140 \
   -O3 -DNDEBUG -fno-strict-aliasing -fstack-protector \
   -funwind-tables -fvisibility=hidden -Wall -Werror -Wextra \
   -Wendif-labels -Wnewline-eof -Wno-missing-field-initializers \
   -Wno-unused-parameter \
   -fno-exceptions -fno-rtti -fno-threadsafe-statics -fobjc-call-cxx-cdtors \
   -fvisibility-inlines-hidden -std=c++20 -Wno-narrowing -Wsign-compare \
   -Wno-undefined-var-template -O3 -MD -MT transfer_util.cc.o  \
   -o transfer_util.cc.o -c libcef_dll/transfer_util.cc 
```

### libcef_dll_wrapper

```make
# compile CXX with /usr/bin/c++

CXX_DEFINES = -DCEF_USE_SANDBOX -DWRAPPING_CEF_SHARED \
    -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS

CXX_INCLUDES = -I/Users/dana/.jsmk/frameworks/CEF/arm64-darwin/140

CXX_FLAGSarm64 = -O3 -DNDEBUG -arch arm64 \
  -isysroot /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX15.5.sdk \
  -mmacosx-version-min=12.0 -fno-strict-aliasing -fstack-protector -funwind-tables \
  -fvisibility=hidden -Wall -Werror -Wextra -Wendif-labels -Wnewline-eof \
  -Wno-missing-field-initializers -Wno-unused-parameter -mmacosx-version-min=12.0 \
  -fno-exceptions -fno-rtti -fno-threadsafe-statics -fobjc-call-cxx-cdtors \
  -fvisibility-inlines-hidden -std=c++17 -Wno-narrowing -Wsign-compare \
  -Wno-undefined-var-template -O3

CXX_FLAGS = -O3 -DNDEBUG -arch arm64 \
  -isysroot /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX15.5.sdk \
  -mmacosx-version-min=12.0 -fno-strict-aliasing -fstack-protector -funwind-tables \
  -fvisibility=hidden -Wall -Werror -Wextra -Wendif-labels -Wnewline-eof \
  -Wno-missing-field-initializers -Wno-unused-parameter -mmacosx-version-min=12.0 \
  -fno-exceptions -fno-rtti -fno-threadsafe-statics -fobjc-call-cxx-cdtors \
  -fvisibility-inlines-hidden -std=c++17 -Wno-narrowing -Wsign-compare \
  -Wno-undefined-var-template -O3
```

### SDKROOT

On MacOS, the Xcode Command Line Tools (CLI tools) define a default `SDKROOT` 
(which corresponds to `isysroot`) through the SDK configuration embedded within 
Xcode and the command-line tools themselves.

#### How Xcode CLI Tools Define a Default `ISYSROOT` / `SDKROOT`
- When you run compiler commands like `clang` or `gcc` from the terminal, 
  they automatically determine the default SDK path (`isysroot`) based on the 
  installed SDKs.
- For `clang`, the default SDK is usually set to the latest SDK available for 
  the installed Xcode or Command Line Tools.

#### Key points
- Xcode SDK paths are stored in:
  ```
  /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/
  ```
- The default SDK (e.g., `MacOSX.sdk`) is linked here, typically:
  ```
  /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk
  ```

- `xcrun` helps determine the active SDK and `isysroot`:
  ```bash
  xcrun --show-sdk-path
  ```
  This outputs the current active SDK path, which is used by default.

- When invoking `clang` without specifying `--sysroot` or `-isysroot`, it automatically uses the SDK path determined by `xcrun` or the default configuration.

#### How is this determined?
- The default `isysroot` is typically set to:
  ```
  /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX<version>.sdk
  ```
- Or, if only CLI tools are installed:
  ```
  /Library/Developer/CommandLineTools/SDKs/MacOSX.sdk
  ```
- The compiler's built-in default is configured during build time to point to these SDK paths.

#### Checking the current default isysroot:
Run:
```bash
clang --print-sdk-path
```
or
```bash
xcrun --show-sdk-path
```

This shows the current SDK used as the default `isysroot`.
