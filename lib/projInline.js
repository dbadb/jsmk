// BuildInlineCppProjects:
//   Constructs a 2-level inline project tree useful for typical open-source
//   projects where we don't wish to drop _Proj.jsmk files directly into a
//   potentially foreign/read-only git repo.
//   Input is a list of javascript objects, each triggering the creation
//   of a project. The entire collection of projects resides below the
//   basename project (usually "apps" or "libs") the input barrier
//   can be set to "after" to signal that following sibling projects 
//   should only be built after the completion of the previous.  Common
//   usage is to have a libs project follwed by an apps project.
//   Each entry of projlist will create a second-level project and is
//   usually associated with a directory within the directory structure.  
//   It's okay to have multiple subproject associated with a single dir,
//   (at least until proven otherwise).
//
//   NB: our canonical form for a single entry in projlist:
//      project name
//          module name (same as proj)
//              #lib creation (optional)
//                  cpp->o task 
//                  c->o task 
//                  o->a task 
//              #exe creation (optional)
//                  cpp->o task (app link inputs)
//                  c->o task (app link inputs)
//                  cpp.o->exe task or cpp.o->so
exports.BuildInlineCppProjects = function(rootproj, basename, projlist, barrier)
{
    let projdir = rootproj.ProjectDir;
    let newProj = rootproj.NewProject(basename, 
    {
        ProjectDir: projdir, // libs is a 'virtual' dir
        barrier: barrier,
        init: function(subProj) 
        {
            let excludeFiles = function(srcfiles, excludes) 
            {
                if(typeof(excludes) == "string")
                    excludes = [excludes];
                for(let i in excludes)
                {
                    let ii = srcfiles.indexOf(excludes[i]);
                    if(ii != -1)
                        srcfiles.splice(ii, 1);
                    else
                    {
                        // jsmk.DEBUG(`${excludes[i]} not in ${srcfiles}`);
                    }
                }
            };

            // each subproject is comprised of a module
            for(let i in projlist)
            {
                let projdir = projlist[i].dir;
                let projnm;
                if(projlist[i].name)
                    projnm = projlist[i].name;
                else
                    projnm = jsmk.path.tail(projdir);
                if(projlist[i].skip === true)
                    continue;
                let buildvars = projlist[i].buildvars;
                let src = projlist[i].src;
                let inc = projlist[i].inc || [];
                let defs = projlist[i].defs;
                let ccflags = projlist[i].ccflags || projlist[i].flags;
                let cppflags = projlist[i].cppflags || projlist[i].flags;
                let ldflags = projlist[i].ldflags;
                let modules = projlist[i].modules;
                let triggers = projlist[i].triggers;
                let deps = projlist[i].deps; // for module refs
                let deplibs = projlist[i].deplibs; // for .a refs
                if(!deps)
                {
                    // libs is deprecated (use deps or modules)
                    deps = projlist[i].libs; 
                }
                let syslibs = projlist[i].syslibs;
                let frameworks = projlist[i].frameworks;
                let clientcfg = projlist[i].clientconfig;
                let isApp = (deplibs || deps || syslibs || frameworks);

                subProj.NewProject(projnm, 
                {
                    ProjectDir: projdir,
                    init: function(subProj) 
                    {
                        if(buildvars && Object.keys(buildvars).length)
                        {
                            // console.log(`NewProject.BuildVars: ` + JSON.stringify(buildvars));
                            console.assert(typeof(buildvars) === "object");
                            subProj.MergeBuildVars(buildvars);
                        }
                        let modConfig = clientcfg ? 
                                {clientconfig: clientcfg,
                                buildvars: buildvars} : {};
                        let m = subProj.NewModule(projnm, modConfig);
                        let libInputs = [], appInputs = [];
                        let extraCfiles = [];
                        if(src.y && src.y.length)
                        {
                            let srcfiles = [];
                            if(typeof src.y == "string")
                                src.y = [src.y];
                            for(let i in src.y)
                            {
                                srcfiles = srcfiles.concat(
                                            subProj.Glob(src.y[i]));
                            }
                            excludeFiles(srcfiles, src.exclude);
                            if(srcfiles.length)
                            {
                                let ty = m.NewTask(`${projnm}_compile_y`, "y->c", 
                                {
                                    inputs: srcfiles,
                                    searchpaths: inc,
                                    define: defs,
                                    triggers: triggers,
                                });
                                let outputs = ty.GetOutputs();
                                extraCfiles = extraCfiles.concat(outputs);
                                inc.push(ty.GetOutputDir());
                            }
                        }
                        if(src.lex)
                        {
                            let srcfiles = [];
                            if(typeof src.lex == "string")
                                src.y = [src.lex];
                            for(let i in src.lex)
                            {
                                srcfiles = srcfiles.concat(
                                            subProj.Glob(src.lex[i]));
                            }
                            excludeFiles(srcfiles, src.exclude);
                            if(srcfiles.length)
                            {
                                let tl = m.NewTask(`${projnm}_compile_lex`, "lex->c",
                                {
                                    inputs: srcfiles,
                                    searchpaths: inc,
                                    define: defs,
                                    triggers: triggers,
                                });
                                // add our outputs to src.c inputs
                                // also, since we produce a header we
                                // add our outputdir to the searchpaths
                                let outputs = tl.GetOutputs();
                                extraCfiles = extraCfiles.concat(outputs);
                            }
                        }
                        // lib.c ---------------------------------
                        if(src.c || extraCfiles.length > 0)
                        {
                            let srcfiles = extraCfiles;
                            if(typeof src.c == "string")
                                src.c = [src.c];
                            for(let i in src.c)
                            {
                                srcfiles = srcfiles.concat(
                                            subProj.Glob(src.c[i]));
                            }
                            // jsmk.NOTICE("c src spec " + src.c);
                            // jsmk.NOTICE("extraCfiles: " + extraCfiles);
                            // jsmk.NOTICE("c src files: " + srcfiles);
                            excludeFiles(srcfiles, src.exclude);
                            if(srcfiles.length)
                            {
                                if(cppflags && !ccflags)
                                    jsmk.NOTICE(`project: ${projnm} has cppflags. Did you mean ccflags?`);
                                let tc = m.NewTask(`${projnm}_compile_c`, "c->o", 
                                {
                                    inputs: srcfiles,
                                    flags: ccflags,
                                    searchpaths: inc,
                                    define: defs,
                                    triggers: triggers,
                                    frameworks: frameworks,
                                });
                                //jsmk.NOTICE("project after: " +
                                    //        JSON.stringify(tc.FlagMap));
                                libInputs = libInputs.concat(
                                                tc.GetOutputs());
                            }
                        }
                        // lib.cpp ----------------------------
                        if(src.cpp)
                        {
                            let srcfiles = [];
                            if(typeof src.cpp == "string")
                                src.cpp = [src.cpp];
                            for(let i in src.cpp)
                            {
                                srcfiles = srcfiles.concat(
                                                subProj.Glob(src.cpp[i]));
                            }
                            excludeFiles(srcfiles, src.exclude);
                            if(srcfiles.length)
                            {
                                if(ccflags && !cppflags)
                                    jsmk.NOTICE(`project: ${projnm} has cflags. Did you mean cppflags?`);
                                let tcpp = m.NewTask(`${projnm}_compile_cpp`, 
                                                    "cpp->o", 
                                {
                                    inputs: srcfiles,
                                    flags: cppflags,
                                    searchpaths: inc,
                                    define: defs,
                                    triggers: triggers,
                                    frameworks: frameworks,
                                });
                                libInputs = libInputs.concat(
                                                tcpp.GetOutputs());
                            }
                            else
                            {
                                jsmk.WARNING(`project ${projnm} found no .cpp files ${subProj.ProjectDir}`);
                            }
                        }
                        if(libInputs.length > 0)
                        {
                            let libnm;
                            if(isApp) 
                                libnm = "lib" + projnm;
                            else
                                libnm = projnm;
                            let tlib = m.NewTask(libnm, "o->a", {
                                inputs: libInputs,
                            });
                            if(isApp)
                                appInputs = tlib.GetOutputs();
                        }
                        else
                        if( !src.appcpp && !src.appc && 
                            !src.dllcpp && !src.dllc && 
                            !src.cpp && !src.c 
                            )
                        {
                            // nb: there may be header-only modules used
                            // to configure clients
                            jsmk.WARNING(`${projnm} ` +
                                    "has no archiveable objects");
                        }

                        // building an app or dll ----------------------------
                        if(src.appcpp || src.dllcpp)
                        {
                            let srcfiles = [];
                            if(typeof src.appcpp == "string")
                                src.appcpp = [src.appcpp];
                            if(typeof src.dllcpp == "string")
                                src.dllcpp = [src.dllcpp];
                            for(let i in src.appcpp)
                            {
                                srcfiles = srcfiles.concat(
                                            subProj.Glob(src.appcpp[i]));
                            }
                            for(let i in src.dllcpp)
                            {
                                srcfiles = srcfiles.concat(
                                            subProj.Glob(src.dllcpp[i]));
                            }
                            excludeFiles(srcfiles, src.exclude);
                            if(srcfiles.length)
                            {
                                let tcpp = m.NewTask(`${projnm}_compile_appcpp`, 
                                                "cpp->o", 
                                {
                                    inputs: srcfiles,
                                    flags: cppflags,
                                    searchpaths: inc,
                                    define: defs,
                                    triggers: triggers,
                                    frameworks: frameworks,
                                });
                                appInputs = appInputs.concat(
                                                tcpp.GetOutputs());
                            }
                            else
                            {
                                jsmk.WARNING("no src files for " + projnm);
                            }
                        } // end app/dllcpp (ie compile)
                        if(src.apprc && src.apprc.len)
                        {
                            let trc = m.NewTask(`${projnm}-meta`, "rc->o", {
                                inputs: src.apprc,
                            });
                            appInputs = appInputs.concat(
                                                trc.GetOutputs());
                        }
                        if(src.appc || src.dllc)
                        {
                            let srcfiles = [];
                            if(typeof src.appc == "string")
                                src.appc = [src.appc];
                            if(typeof src.dllc == "string")
                                src.dllc = [src.dllc];
                            for(let i in src.appc)
                            {
                                srcfiles = srcfiles.concat(
                                            subProj.Glob(src.appc[i]));
                            }
                            for(let i in src.dllc)
                            {
                                srcfiles = srcfiles.concat(
                                            subProj.Glob(src.dllc[i]));
                            }
                            excludeFiles(srcfiles, src.exclude);
                            if(srcfiles.length)
                            {
                                let tc = m.NewTask(`${projnm}-compile_appc`, 
                                                "c->o", {
                                    inputs: srcfiles,
                                    flags: ccflags,
                                    searchpaths: inc,
                                    define: defs,
                                    triggers: triggers,
                                    frameworks: frameworks,
                                });
                                appInputs = appInputs.concat(
                                                tc.GetOutputs());
                            }
                        } 

                        // app link!
                        if(appInputs.length > 0)
                        {
                            let inputs = appInputs;
                            if(!deplibs)
                                deplibs = [];
                            for(let i in deps) // deps may be null
                            {
                                // modules expressed as deps are deprecated
                                deplibs.push(...rootproj.FindModuleOutputs(deps[i]));
                            }
                            if(deplibs.length)
                                jsmk.DEBUG(`${projnm} deplibs: ${deplibs}`)

                            let rule = (src.dllcpp || src.dllc) ? 
                                        "cpp.o->so" : "cpp.o->exe";
                            let tapp = m.NewTask(projnm, rule, 
                            {
                                inputs: inputs,
                                deps: deplibs,
                                libs: syslibs,
                                frameworks: frameworks,
                                flags: ldflags,
                                // apps don't configclients, right?
                            });
                            if(src.installdir)
                            {
                                let irule = "install";
                                let iname = projnm+"Install";
                                let inputs = tapp.GetOutputs() || [];
                                m.NewTask(iname, irule, {
                                        inputs: inputs,
                                        installdir: src.installdir, 
                                        installext: src.installext, 
                                        // undef ok
                                });
                            }
                        }
                        // We add modules last to this module so it doesn't
                        // get burned into tasks.  Rather module-only modules 
                        // are applied late...
                        if(modules) m.AddModules(modules);
                    } // end init
                });
            }
        }
    });
    return newProj;
}


