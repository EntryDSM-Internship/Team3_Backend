exports.codeGenerator = () => {
    let code = '';
    for(var i = 0; i < 6; i++) {
        code += Math.floor(Math.random() * 10);
    }
    return code;
}