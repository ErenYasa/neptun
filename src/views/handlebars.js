const hbs = require("gulp-compile-handlebars");

hbs.Handlebars.registerHelper({
    upper: function (str) {
        return str.toUpperCase();
    },
    log: function (data) {
        console.log(data);
    }
})

module.exports = hbs;
