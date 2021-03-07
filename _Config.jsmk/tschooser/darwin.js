
exports.GetToolsets = function()
{
    let clang = jsmk.LoadConfig("toolset/clang.js").Toolset;
    return [
        new clang()
    ];
};