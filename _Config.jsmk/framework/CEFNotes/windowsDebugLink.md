### compile resources
C:\Program Files (x86)\Windows Kits\10\bin\10.0.26100.0\x64\rc.exe 
    /D _UNICODE /D UNICODE /D WIN32 /D _DEBUG /D _WINDOWS 
    /D __STDC_CONSTANT_MACROS /D __STDC_FORMAT_MACROS 
    /D _WIN32 /D UNICODE /D _UNICODE /D WINVER=0x0A00 
    /D _WIN32_WINNT=0x0A00 /D NTDDI_VERSION=NTDDI_WIN10_FE 
    /D NOMINMAX /D WIN32_LEAN_AND_MEAN /D _HAS_EXCEPTIONS=0 
    /D CEF_USE_BOOTSTRAP /D CEF_USE_ATL 
    /D "CMAKE_INTDIR=\\\"Debug\\\"" 
    /D cefclient_EXPORTS /l"0x0409" 
      /I"."
      /nologo /fo"cefclient.dir\Debug\cefclient.res" 
      "tests\cefclient\win\cefclient.rc"

### link
C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Tools\MSVC\14.44.35207\bin\HostX64\x64\link.exe 
    /ERRORREPORT:PROMPT 
    /OUT:".../.../cefclient.dll" 
    /INCREMENTAL /ILK:"cefclient.dir\Debug\cefclient.ilk" /NOLOGO 
    ..\..\..\Debug\libcef.lib ..\..\libcef_dll_wrapper\Debug\libcef_dll_wrapper.lib 
    comctl32.lib crypt32.lib delayimp.lib gdi32.lib rpcrt4.lib shlwapi.lib wintrust.lib 
    ws2_32.lib d3d11.lib glu32.lib imm32.lib opengl32.lib oleacc.lib kernel32.lib user32.lib 
    gdi32.lib winspool.lib shell32.lib ole32.lib oleaut32.lib uuid.lib comdlg32.lib advapi32.lib 
    Delayimp.lib 
    /DELAYLOAD:libcef.dll /DELAYLOAD:"api-ms-win-core-winrt-error-l1-1-0.dll" 
    /DELAYLOAD:"api-ms-win-core-winrt-l1-1-0.dll" /DELAYLOAD:"api-ms-win-core-winrt-string-l1-1-0.dll" 
    /DELAYLOAD:advapi32.dll /DELAYLOAD:comctl32.dll /DELAYLOAD:comdlg32.dll /DELAYLOAD:credui.dll 
    /DELAYLOAD:cryptui.dll /DELAYLOAD:d3d11.dll /DELAYLOAD:d3d9.dll /DELAYLOAD:dwmapi.dll 
    /DELAYLOAD:dxgi.dll /DELAYLOAD:dxva2.dll /DELAYLOAD:esent.dll /DELAYLOAD:gdi32.dll 
    /DELAYLOAD:hid.dll /DELAYLOAD:imagehlp.dll /DELAYLOAD:imm32.dll /DELAYLOAD:msi.dll 
    /DELAYLOAD:netapi32.dll /DELAYLOAD:ncrypt.dll /DELAYLOAD:ole32.dll /DELAYLOAD:oleacc.dll 
    /DELAYLOAD:propsys.dll /DELAYLOAD:psapi.dll /DELAYLOAD:rpcrt4.dll /DELAYLOAD:rstrtmgr.dll 
    /DELAYLOAD:setupapi.dll /DELAYLOAD:shell32.dll /DELAYLOAD:shlwapi.dll 
    /DELAYLOAD:uiautomationcore.dll /DELAYLOAD:urlmon.dll /DELAYLOAD:user32.dll 
    /DELAYLOAD:usp10.dll /DELAYLOAD:uxtheme.dll /DELAYLOAD:wer.dll /DELAYLOAD:wevtapi.dll 
    /DELAYLOAD:wininet.dll /DELAYLOAD:winusb.dll /DELAYLOAD:wsock32.dll /DELAYLOAD:wtsapi32.dll 
    /DELAYLOAD:crypt32.dll /DELAYLOAD:dbghelp.dll /DELAYLOAD:dhcpcsvc.dll /DELAYLOAD:dwrite.dll 
    /DELAYLOAD:iphlpapi.dll /DELAYLOAD:oleaut32.dll /DELAYLOAD:secur32.dll /DELAYLOAD:userenv.dll 
    /DELAYLOAD:winhttp.dll /DELAYLOAD:winmm.dll /DELAYLOAD:winspool.drv /DELAYLOAD:wintrust.dll 
    /DELAYLOAD:ws2_32.dll /DELAYLOAD:glu32.dll /DELAYLOAD:oleaut32.dll /DELAYLOAD:opengl32.dll 
    /MANIFEST /MANIFESTUAC:"level='asInvoker' uiAccess='false'" 
    /manifest:embed 
    /DEBUG /PDB:"C:/Users/dana/Documents/src/github.cannerycoders/CEFapp/_frameworks/CEF/x86_64-win32/139/build/tests/cefclient/Debug/cefclient.pdb" 
    /SUBSYSTEM:CONSOLE /TLBID:1 
    /DYNAMICBASE /NXCOMPAT 
    /IMPLIB:"C:/Users/dana/Documents/src/github.cannerycoders/CEFapp/_frameworks/CEF/x86_64-win32/139/build/tests/cefclient/Debug/cefclient.lib" 
    /MACHINE:X64  /machine:x64 /DLL 
    cefclient.dir\Debug\cefclient.res
    cefclient.dir\Debug\base_client_handler.obj
    cefclient.dir\Debug\binary_transfer_test.obj
    cefclient.dir\Debug\binding_test.obj
    cefclient.dir\Debug\browser_window.obj
    cefclient.dir\Debug\bytes_write_handler.obj
    cefclient.dir\Debug\client_app_delegates_browser.obj
    cefclient.dir\Debug\client_browser.obj
    cefclient.dir\Debug\client_handler.obj
    cefclient.dir\Debug\client_handler_osr.obj
    cefclient.dir\Debug\client_handler_std.obj
    cefclient.dir\Debug\client_prefs.obj
    cefclient.dir\Debug\config_test.obj
    cefclient.dir\Debug\default_client_handler.obj
    cefclient.dir\Debug\dialog_test.obj
    cefclient.dir\Debug\hang_test.obj
    cefclient.dir\Debug\image_cache.obj
    cefclient.dir\Debug\main_context.obj
    cefclient.dir\Debug\main_context_impl.obj
    cefclient.dir\Debug\media_router_test.obj
    cefclient.dir\Debug\osr_renderer.obj
    cefclient.dir\Debug\preferences_test.obj
    cefclient.dir\Debug\response_filter_test.obj
    cefclient.dir\Debug\root_window.obj
    cefclient.dir\Debug\root_window_create.obj
    cefclient.dir\Debug\root_window_manager.obj
    cefclient.dir\Debug\root_window_views.obj
    cefclient.dir\Debug\scheme_test.obj
    cefclient.dir\Debug\server_test.obj
    cefclient.dir\Debug\task_manager_test.obj
    cefclient.dir\Debug\test_runner.obj
    cefclient.dir\Debug\urlrequest_test.obj
    cefclient.dir\Debug\views_menu_bar.obj
    cefclient.dir\Debug\views_overlay_browser.obj
    cefclient.dir\Debug\views_overlay_controls.obj
    cefclient.dir\Debug\views_style.obj
    cefclient.dir\Debug\views_window.obj
    cefclient.dir\Debug\window_test.obj
    cefclient.dir\Debug\window_test_runner.obj
    cefclient.dir\Debug\window_test_runner_views.obj
    cefclient.dir\Debug\client_app_browser.obj
    cefclient.dir\Debug\file_util.obj
    cefclient.dir\Debug\geometry_util.obj
    cefclient.dir\Debug\main_message_loop.obj
    cefclient.dir\Debug\main_message_loop_external_pump.obj
    cefclient.dir\Debug\main_message_loop_std.obj
    cefclient.dir\Debug\client_app_delegates_common.obj
    cefclient.dir\Debug\scheme_test_common.obj
    cefclient.dir\Debug\binary_value_utils.obj
    cefclient.dir\Debug\client_app.obj
    cefclient.dir\Debug\client_app_other.obj
    cefclient.dir\Debug\client_switches.obj
    cefclient.dir\Debug\string_util.obj
    cefclient.dir\Debug\client_app_delegates_renderer.obj
    cefclient.dir\Debug\client_renderer.obj
    cefclient.dir\Debug\ipc_performance_test.obj
    cefclient.dir\Debug\performance_test.obj
    cefclient.dir\Debug\performance_test_tests.obj
    cefclient.dir\Debug\client_app_renderer.obj
    cefclient.dir\Debug\cefclient_win.obj
    cefclient.dir\Debug\browser_window_osr_win.obj
    cefclient.dir\Debug\browser_window_std_win.obj
    cefclient.dir\Debug\main_context_impl_win.obj
    cefclient.dir\Debug\main_message_loop_multithreaded_win.obj
    cefclient.dir\Debug\osr_accessibility_helper.obj
    cefclient.dir\Debug\osr_accessibility_node.obj
    cefclient.dir\Debug\osr_accessibility_node_win.obj
    cefclient.dir\Debug\osr_d3d11_win.obj
    cefclient.dir\Debug\osr_dragdrop_win.obj
    cefclient.dir\Debug\osr_ime_handler_win.obj
    cefclient.dir\Debug\osr_render_handler_win.obj
    cefclient.dir\Debug\osr_render_handler_win_d3d11.obj
    cefclient.dir\Debug\osr_render_handler_win_gl.obj
    cefclient.dir\Debug\osr_window_win.obj
    cefclient.dir\Debug\resource_util_win_idmap.obj
    cefclient.dir\Debug\root_window_win.obj
    cefclient.dir\Debug\temp_window_win.obj
    cefclient.dir\Debug\window_test_runner_win.obj
    cefclient.dir\Debug\main_message_loop_external_pump_win.obj
    cefclient.dir\Debug\resource_util_win.obj
    cefclient.dir\Debug\util_win.obj