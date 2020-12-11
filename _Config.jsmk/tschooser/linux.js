exports.GetToolsets = function()
{
    let gcc = jsmk.LoadConfig("toolset/gcc.js").Toolset;
    var result = [
        new gcc({
            vers: "83" // 8.3 on raspi4
         }),
    ];
    return result;
};
