const hbs = require('gulp-compile-handlebars');

hbs.Handlebars.registerHelper({
    upper(str) {
        return str.toUpperCase();
    },
    log(data) {
        // eslint-disable-next-line no-console
        console.log(data);
    },
});

module.exports = hbs;
