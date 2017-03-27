//
// A Framework for Intel's thread-building-blocks (TBB) c++ library
//
//  currently we require that the tbb dll's be in path
//  (the free distro doesn't appear to have a static link option)
//
let Framework = jsmk.Require("framework").Framework;
let Tool = jsmk.Require("tool").Tool;
let Toolset = jsmk.Require("toolset").Toolset;

class embree extends Framework
{
    constructor(name, version)
    {
        super(name, version);
        this.m_toolset = jsmk.GetActiveToolset();
        this.m_arch = this.m_toolset.TargetArch;
        let eArch;
        switch(this.m_arch)
        {
        case Toolset.Arch.x86_64:
            eArch = "x64";
            break;
        default:
            break;
        }
        if(!eArch)
            throw new Error("embree toolset arch not supported:" + this.m_arch);

        switch(this.m_version)
        {
        case "default":
        case "2.15":
            this.m_rootDir = `D:/Program Files/Intel/Embree v2.15.0 ${eArch}`;
            break;
        default:
            throw new Exception("embree frameork version botch: ", version);
        }

        this.m_incDir = jsmk.path.join(this.m_rootDir, "include");
        this.m_libDir = jsmk.path.join(this.m_rootDir, "bin");
    }

    ConfigureTaskSettings(task)
    {
        let tool = task.GetTool();
        switch(tool.GetRole())
        {
        case Tool.Role.Compile:
            task.AddSearchpaths([this.m_incDir]);
            break;
        case Tool.Role.Link:
            task.AddSerachpaths([this.m_libDir]);
            let libs= ["embree.dll"]; // also? freeglut, tbband tbbmalloc?
            tool.AddLibraries(libs);
            break;
        }
    }
}

exports.Framework = embree;

/*
set TBB_BIN_DIR=%~d0%~p0

set TBBROOT=%TBB_BIN_DIR%..

:: Set the default arguments
set TBB_TARGET_ARCH=
set TBB_TARGET_VS=

:ParseArgs
:: Parse the incoming arguments
if /i "%1"==""        goto SetEnv
if /i "%1"=="ia32"         (set TBB_TARGET_ARCH=ia32)    & shift & goto ParseArgs
if /i "%1"=="intel64"      (set TBB_TARGET_ARCH=intel64) & shift & goto ParseArgs
if /i "%1"=="vs2012"       (set TBB_TARGET_VS=vc11)      & shift & goto ParseArgs
if /i "%1"=="vs2013"       (set TBB_TARGET_VS=vc12)      & shift & goto ParseArgs
if /i "%1"=="vs2015"       (set TBB_TARGET_VS=vc14)      & shift & goto ParseArgs
if /i "%1"=="vs2017"       (set TBB_TARGET_VS=vc14)      & shift & goto ParseArgs
if /i "%1"=="all"          (set TBB_TARGET_VS=vc_mt)     & shift & goto ParseArgs
:: for any other incoming arguments values
goto Syntax

:SetEnv
:: target architecture is a required argument
if "%TBB_TARGET_ARCH%"=="" goto Syntax
:: TBB_TARGET_VS default value is 'vc_mt'
if "%TBB_TARGET_VS%"=="" set TBB_TARGET_VS=vc_mt

set TBB_ARCH_PLATFORM=%TBB_TARGET_ARCH%\%TBB_TARGET_VS%
if exist "%TBB_BIN_DIR%\%TBB_ARCH_PLATFORM%\tbb.dll" set PATH=%TBB_BIN_DIR%\%TBB_ARCH_PLATFORM%;%PATH%
if exist "%TBBROOT%\..\redist\%TBB_TARGET_ARCH%\tbb\%TBB_TARGET_VS%\tbb.dll" set PATH=%TBBROOT%\..\redist\%TBB_TARGET_ARCH%\tbb\%TBB_TARGET_VS%;%PATH%
set LIB=%TBBROOT%\lib\%TBB_ARCH_PLATFORM%;%LIB%
set INCLUDE=%TBBROOT%\include;%INCLUDE%
set CPATH=%TBBROOT%\include;%CPATH%
if exist "%TBBROOT%\lib\mic\libtbb.so" (
    set "MIC_LIBRARY_PATH=%TBBROOT%\lib\mic;%MIC_LIBRARY_PATH%"
    set "MIC_LD_LIBRARY_PATH=%TBBROOT%\lib\mic;%MIC_LD_LIBRARY_PATH%"
)
if exist "%TBBROOT%\..\..\linux\tbb\lib\intel64\gcc4.7\libtbb.so" (
    set "LIBRARY_PATH=%TBBROOT%\..\..\linux\tbb\lib\intel64\gcc4.7;%LIBRARY_PATH%"
    set "LD_LIBRARY_PATH=%TBBROOT%\..\..\linux\tbb\lib\intel64\gcc4.7;%LD_LIBRARY_PATH%"
)
if not "%ICPP_COMPILER15%"=="" set TBB_CXX=icl.exe
if not "%ICPP_COMPILER16%"=="" set TBB_CXX=icl.exe
if not "%ICPP_COMPILER17%"=="" set TBB_CXX=icl.exe
goto End
*/
