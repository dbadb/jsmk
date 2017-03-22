//
// a Frameworkf for intel's thread-building-blocks (TBB) c++ library
//
let Framework = jsmk.Require("framework").Framework;

class tbb extends Framework
{
    constructor(version)
    {
        this.m_rootDir = "D:/Program Files/Intel/tbb2017_20170226oss_win/tbb2017_20170226oss";
    }

    ConfigureTaskSettings(task)
    {
        super.ConfigureTaskSettings(task);
    }
}

/*
exports.Framework = tbb;
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
