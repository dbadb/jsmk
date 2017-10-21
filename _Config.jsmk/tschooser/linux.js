exports.GetToolsets = function()
{
    let gcc = jsmk.LoadConfig("toolset/gcc.js").Toolset;
    var result = [
        new gcc({
            vers: "63"
         }),
    ];
    return result;
};
