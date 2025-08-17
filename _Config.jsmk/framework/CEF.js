//
// A Framework for CEF - Chromium Embedded Framework.
//
// assumes: 
//  - binary release-mode distribution downloaded from eg: 
/          https://cef-builds.spotifycdn.com/index.html
//    and placed below ${PROJ}/_frameworks/CEF/${ARCH}/${CEFVERS}/...
//    eg: _frameworks/CEF/x86_64-win32/139/...  (NB: distributes are large so can't
//         be checked in).
//  - Project is extended to include compilation of C++ dll-bridge components
//    via jsmk.GetFramework("CEF", vers?).ConfigureProject(Project, "compileC++Binding");
//  - Project can resolve relative paths below itself (and into _frameworks/...)
//    
// issues:
//  - on macos we must produce a collection of apps (to support secure subprocesses?)
//    For Spotiy.spp/Frameworks: 
//          Chromium Embedded Framework.framework/ 
//          Spotify Helper (Renderer).app/
//          Spotify Helper (GPU).app/              
//          Spotify Helper.app/
//          Spotify Helper (Plugin).app/
//   and eg, refs to cross-app dylibs are relative:
//      ../../../Chromium Embedded Framework.framework/Libraries/libcef_sandbox.dylib
//
let Framework = jsmk.Require("framework").Framework;
let Tool = jsmk.Require("tool").Tool;
let Toolset = jsmk.Require("toolset").Toolset;
let Platform = jsmk.GetHost().Platform;

const defaultCEFVers = "139"; // 8/25
const defaultConfigProj = "compileC++Binding";

class CEF extends Framework
{
    // user's Project requests access to a framework by name and version.  
    constructor(name, version=defaultCEFVers)
    {
        super(name, version);
        this.m_toolset = jsmk.GetActiveToolset();
        this.m_arch = this.m_toolset.TargetArch;
        this.m_fwdir = `_frameworks/CEF/${this.m_arch}/${this.GetVersion()}`;
    }

    ConfigureProject(proj, how=defaultConfigProj)
    {
        swtich(how)
        {
        case defaultConfigProj:
            this.addBindingToProj(proj);
            break;
        default:
            throw Error(`CEF can't config project ${how}`);
        }
    }


    ConfigureTaskSettings(task)
    {
        let tool = task.GetTool();
        let r = tool.GetRole();
        switch(r)
        {
        case Tool.Role.Compile:
            if(this.m_incdirs)
                task.AddSearchpaths(r, this.m_incdirs);
            break;
        case Tool.Role.Link:
        case Tool.Role.ArchiveDynamic:
            if(this.m_libs)
                task.AddLibs(this.m_libs);
            break;
        }
    }


    addBindingToProj(proj)
    {
        let m = proj.NewModule("CEFBinding");
        let csrcfiles = `${this.m_fwdir}/
        let t = m.NewTask("compileCEFBinding", "cpp->o", {
                        srcfiles, 
                        flags,
                        define
                    });
    }
}

exports.Framework = CEF;


/* output from cmake ..
-- Building for: Visual Studio 17 2022
-- Selecting Windows SDK version 10.0.26100.0 to target Windows 10.0.22631.
-- The C compiler identification is MSVC 19.44.35208.0
-- The CXX compiler identification is MSVC 19.44.35208.0
-- Detecting C compiler ABI info
-- Detecting C compiler ABI info - done
-- Check for working C compiler: C:/Program Files/Microsoft Visual Studio/2022/Community/VC/Tools/MSVC/14.44.35207/bin/Hostx64/x64/cl.exe - skipped
-- Detecting C compile features
-- Detecting C compile features - done
-- Detecting CXX compiler ABI info
-- Detecting CXX compiler ABI info - done
-- Check for working CXX compiler: C:/Program Files/Microsoft Visual Studio/2022/Community/VC/Tools/MSVC/14.44.35207/bin/Hostx64/x64/cl.exe - skipped
-- Detecting CXX compile features
-- Detecting CXX compile features - done
-- *** CEF CONFIGURATION SETTINGS ***
-- Generator:                    Visual Studio 17 2022
-- Platform:                     Windows
-- Project architecture:         x86_64
-- Binary distribution root:     C:/Users/dana/Documents/src/github.cannerycoders/CEFapp/_frameworks/CEF/x86_64-win32/139
-- Visual Studio ATL support:    ON
-- CEF sandbox:                  ON
-- Standard libraries:           comctl32.lib;crypt32.lib;delayimp.lib;gdi32.lib;rpcrt4.lib;shlwapi.lib;wintrust.lib;ws2_32.lib
-- Compile defines:              __STDC_CONSTANT_MACROS;__STDC_FORMAT_MACROS;WIN32;_WIN32;_WINDOWS;UNICODE;_UNICODE;WINVER=0x0A00;_WIN32_WINNT=0x0A00;NTDDI_VERSION=NTDDI_WIN10_FE;NOMINMAX;WIN32_LEAN_AND_MEAN;_HAS_EXCEPTIONS=0;CEF_USE_BOOTSTRAP;CEF_USE_ATL
-- Compile defines (Debug):
-- Compile defines (Release):    NDEBUG;_NDEBUG
-- C compile flags:              /MP;/Gy;/GR-;/W4;/WX;/wd4100;/wd4127;/wd4244;/wd4324;/wd4481;/wd4512;/wd4701;/wd4702;/wd4996;/Zi
-- C compile flags (Debug):      /MTd;/RTC1;/Od
-- C compile flags (Release):    /MT;/O2;/Ob2;/GF
-- C++ compile flags:            /MP;/Gy;/GR-;/W4;/WX;/wd4100;/wd4127;/wd4244;/wd4324;/wd4481;/wd4512;/wd4701;/wd4702;/wd4996;/Zi /std:c++17
-- C++ compile flags (Debug):    /MTd;/RTC1;/Od
-- C++ compile flags (Release):  /MT;/O2;/Ob2;/GF
-- Exe link flags:                /MANIFEST:NO;/LARGEADDRESSAWARE;/DELAYLOAD:libcef.dll;/DELAYLOAD:api-ms-win-core-winrt-error-l1-1-0.dll;/DELAYLOAD:api-ms-win-core-winrt-l1-1-0.dll;/DELAYLOAD:api-ms-win-core-winrt-string-l1-1-0.dll;/DELAYLOAD:advapi32.dll;/DELAYLOAD:comctl32.dll;/DELAYLOAD:comdlg32.dll;/DELAYLOAD:credui.dll;/DELAYLOAD:cryptui.dll;/DELAYLOAD:d3d11.dll;/DELAYLOAD:d3d9.dll;/DELAYLOAD:dwmapi.dll;/DELAYLOAD:dxgi.dll;/DELAYLOAD:dxva2.dll;/DELAYLOAD:esent.dll;/DELAYLOAD:gdi32.dll;/DELAYLOAD:hid.dll;/DELAYLOAD:imagehlp.dll;/DELAYLOAD:imm32.dll;/DELAYLOAD:msi.dll;/DELAYLOAD:netapi32.dll;/DELAYLOAD:ncrypt.dll;/DELAYLOAD:ole32.dll;/DELAYLOAD:oleacc.dll;/DELAYLOAD:propsys.dll;/DELAYLOAD:psapi.dll;/DELAYLOAD:rpcrt4.dll;/DELAYLOAD:rstrtmgr.dll;/DELAYLOAD:setupapi.dll;/DELAYLOAD:shell32.dll;/DELAYLOAD:shlwapi.dll;/DELAYLOAD:uiautomationcore.dll;/DELAYLOAD:urlmon.dll;/DELAYLOAD:user32.dll;/DELAYLOAD:usp10.dll;/DELAYLOAD:uxtheme.dll;/DELAYLOAD:wer.dll;/DELAYLOAD:wevtapi.dll;/DELAYLOAD:wininet.dll;/DELAYLOAD:winusb.dll;/DELAYLOAD:wsock32.dll;/DELAYLOAD:wtsapi32.dll;/DELAYLOAD:crypt32.dll;/DELAYLOAD:dbghelp.dll;/DELAYLOAD:dhcpcsvc.dll;/DELAYLOAD:dwrite.dll;/DELAYLOAD:iphlpapi.dll;/DELAYLOAD:oleaut32.dll;/DELAYLOAD:secur32.dll;/DELAYLOAD:userenv.dll;/DELAYLOAD:winhttp.dll;/DELAYLOAD:winmm.dll;/DELAYLOAD:winspool.drv;/DELAYLOAD:wintrust.dll;/DELAYLOAD:ws2_32.dll;/STACK:0x800000
-- Exe link flags (Debug):       /DEBUG
-- Exe link flags (Release):
-- Shared link flags:             /DELAYLOAD:libcef.dll;/DELAYLOAD:api-ms-win-core-winrt-error-l1-1-0.dll;/DELAYLOAD:api-ms-win-core-winrt-l1-1-0.dll;/DELAYLOAD:api-ms-win-core-winrt-string-l1-1-0.dll;/DELAYLOAD:advapi32.dll;/DELAYLOAD:comctl32.dll;/DELAYLOAD:comdlg32.dll;/DELAYLOAD:credui.dll;/DELAYLOAD:cryptui.dll;/DELAYLOAD:d3d11.dll;/DELAYLOAD:d3d9.dll;/DELAYLOAD:dwmapi.dll;/DELAYLOAD:dxgi.dll;/DELAYLOAD:dxva2.dll;/DELAYLOAD:esent.dll;/DELAYLOAD:gdi32.dll;/DELAYLOAD:hid.dll;/DELAYLOAD:imagehlp.dll;/DELAYLOAD:imm32.dll;/DELAYLOAD:msi.dll;/DELAYLOAD:netapi32.dll;/DELAYLOAD:ncrypt.dll;/DELAYLOAD:ole32.dll;/DELAYLOAD:oleacc.dll;/DELAYLOAD:propsys.dll;/DELAYLOAD:psapi.dll;/DELAYLOAD:rpcrt4.dll;/DELAYLOAD:rstrtmgr.dll;/DELAYLOAD:setupapi.dll;/DELAYLOAD:shell32.dll;/DELAYLOAD:shlwapi.dll;/DELAYLOAD:uiautomationcore.dll;/DELAYLOAD:urlmon.dll;/DELAYLOAD:user32.dll;/DELAYLOAD:usp10.dll;/DELAYLOAD:uxtheme.dll;/DELAYLOAD:wer.dll;/DELAYLOAD:wevtapi.dll;/DELAYLOAD:wininet.dll;/DELAYLOAD:winusb.dll;/DELAYLOAD:wsock32.dll;/DELAYLOAD:wtsapi32.dll;/DELAYLOAD:crypt32.dll;/DELAYLOAD:dbghelp.dll;/DELAYLOAD:dhcpcsvc.dll;/DELAYLOAD:dwrite.dll;/DELAYLOAD:iphlpapi.dll;/DELAYLOAD:oleaut32.dll;/DELAYLOAD:secur32.dll;/DELAYLOAD:userenv.dll;/DELAYLOAD:winhttp.dll;/DELAYLOAD:winmm.dll;/DELAYLOAD:winspool.drv;/DELAYLOAD:wintrust.dll;/DELAYLOAD:ws2_32.dll
-- Shared link flags (Debug):    /DEBUG
-- Shared link flags (Release):
-- CEF Binary files:             chrome_elf.dll;d3dcompiler_47.dll;libcef.dll;libEGL.dll;libGLESv2.dll;v8_context_snapshot.bin;vk_swiftshader.dll;vk_swiftshader_icd.json;vulkan-1.dll;dxil.dll;dxcompiler.dll
-- CEF Resource files:           chrome_100_percent.pak;chrome_200_percent.pak;resources.pak;icudtl.dat;locales
-- Could NOT find Doxygen (missing: DOXYGEN_EXECUTABLE)
CMake Warning at CMakeLists.txt:254 (message):
  Doxygen must be installed to generate API documentation.


-- Configuring done
-- Generating done
-- Build files have been written to: C:/Users/dana/Documents/src/github.cannerycoders/CEFapp/_frameworks/CEF/x86_64-win32/139/build
*/
