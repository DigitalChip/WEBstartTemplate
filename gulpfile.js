"use strict";

global.hostname = "localhost",  // domain
    global.port = 80;               // port

var src_dir_name = 'src',               // папка, где мы пишем наш проект
    build_dir_name = 'build',           // в эту папку собирается окончательный вид проекта для продакшена
    vendor_dir_name = 'node_modules';   // папка, куда устанавливаются сторонние библиотеки


var path = {
    build: { //Тут мы укажем куда складывать готовые после сборки файлы
        html: build_dir_name,
        js: build_dir_name + '/js/',
        css: build_dir_name + '/css/',
        img: build_dir_name + '/img/',
        fonts: build_dir_name + '/fonts/',
        htaccess: build_dir_name,
    },
    src: { //Пути откуда брать исходники
        d_html: src_dir_name + '/',                 // Директория для HTML файлов
        f_html: src_dir_name + '/*.html',           // Синтаксис src/ *.html говорит gulp что мы хотим взять все файлы с расширением .html
        d_js: src_dir_name + '/js/',                // Директория для JavaScripts
        f_js: src_dir_name + '/js/[^_]*.js',        // все JS без подчеркивания
        f_sass: src_dir_name + '/sass/**/*.*',      // любые файлы в любых подкатегориях
        d_css: src_dir_name + '/css/',              // директория с css-файлами
        f_css:  '/css/**/*.css',                    // css-файлы (включая рекурсивно поддиректории)
        // f_css: [
        //     src_dir_name + '/css/**/*.css',         // css-файлы (включая рекурсивно поддиректории)
        //     '!' + src_dir_name + '/css/**/*.min.css' // кроме минифицированных
        // ],
        //f_cssVendor:      src_dir_name + '/css/vendor/*.*', // Если мы хотим файлы библиотек отдельно хранить то раскоментить строчку
        d_img: src_dir_name + '/img/',              // Папка img
        f_img: src_dir_name + '/img/**/*.*',        // Синтаксис img/**/*.* означает - взять все файлы всех расширений из папки и из вложенных каталогов
        d_fonts: src_dir_name + '/fonts/',
        f_fonts: src_dir_name + '/fonts/**/*.*',
        d_vendor: vendor_dir_name + '/',
        f_vendor: [                                  // Список JS библиотек, необходимых в проекте
            vendor_dir_name + '/jquery/dist/jquery.min.js',           // Берем jQuery
            vendor_dir_name + '/bootstrap/dist/js/bootstrap.min.js',  // Берем BootstrapJS
            vendor_dir_name + '/popper.js/dist/umd/popper.min.js',    // Берем PopperJS
            src_dir_name + '/js/common.js'                            // Наш файл со скриптами   
        ],
        css_vendor: [                                // Список CSS библиотек, у которых нет SASS 
            //vendor_dir_name + '/bootstrap/dist/css/bootstrap.min.css',  // Берем, к примеру, BootstrapCSS
        ],

    },
    watch: { //Тут мы укажем, за изменением каких файлов мы хотим наблюдать
        sass: src_dir_name + '/sass/**/*.*',
        html: src_dir_name + '/**/*.html',
        js: src_dir_name + '/js/**/*.js',
        css: src_dir_name + '/css/**/*.*',
        img: src_dir_name + '/css/images/**/*.*',
        fonts: src_dir_name + '/fonts/**/*.*',
    },
    clean: './' + build_dir_name,   //директории которые могут очищаться
    outputDir: './' + build_dir_name    //исходная корневая директория для запуска минисервера
};

//gulp-uncss // Удаляет лишние стили
// gulp-rigger — это просто киллер фича. Плагин позволяет импортировать один файл в другой простой конструкцией  //= footer.html
// и эта строка при компиляции будет заменена на содержимое файла footer.html                

var gulp = require('gulp'),                     // Gulp собственной персоной
    sass = require('gulp-sass'),                // Подключаем Sass пакет,
    autoprefixer = require('gulp-autoprefixer'),// Добавляет пристаки вендоров для браузера (-webkit, -o, -ms...)
    concat = require('gulp-concat'),            // Подключаем gulp-concat (для конкатенации файлов)
    uglify = require('gulp-uglifyjs'),          // Подключаем gulp-uglifyjs (для сжатия JS)
    cssnano = require('gulp-cssnano'),          // Подключаем пакет для минификации CSS
    rename = require('gulp-rename'),            // Подключаем библиотеку для переименования файлов
    del = require('del'),                       // Подключаем библиотеку для удаления файлов и папок
    imagemin = require('gulp-imagemin'),        // Подключаем библиотеку для работы с изображениями
    pngquant = require('imagemin-pngquant'),    // Подключаем библиотеку для работы с png
    cache = require('gulp-cache'),              // Подключаем библиотеку кеширования
    rimraf = require('rimraf'),                 // Подключаем библиотеку очистки
    plumber = require("gulp-plumber"),          // предохранитель для остановки гальпа
    rigger = require("gulp-rigger"),            // Плагин позволяет импортировать один HTML файл в другой простой конструкцией  //= footer.html
    connect = require("gulp-connect"),          // сервер для livereload
    livereload = require('gulp-livereload');

// *** LIVE RELOAD TASK
// запускает live-reload сервер
gulp.task('lrserver', function () {
    console.log("lrserver");
    return connect.server({
        root: build_dir_name,   // запускаем в папке собранного проекта - build
        livereload: true
    });
}); /* Теперь для обновления страницы, при изменении файлов нужно вызывать  .pipe(gulp.dest(path);  */


// *** Чистим кеш картинок
gulp.task('clear', function (callback) {
    return cache.clearAll();
})

// *** Чистим каталог дистрибутива
gulp.task('clean', function (cb) {
    rimraf(path.clean, cb);
});

// *** Компилируем sass и сжимаем
// Здесь компилируются как собственные стили, так и sass-файлы подключаемых библиотек (через файл _vendor_libs.sass)
gulp.task('sass', function () {
    return gulp.src(path.src.f_sass)            // Берем источник
        .pipe(plumber())                        // Предохраняем от вылета Gulp
        .pipe(sass().on('error', sass.logError))// Преобразуем Sass в CSS посредством gulp-sass (и боремся с вылетом при ошибках)
        .pipe(autoprefixer({                    // Добавляем браузерные префиксы к свойствам
            browsers: ['last 3 versions'],      // Добавляем префиксы для браузеров последних 3 версий (-webkit, -o, -moz, ...)
            cascade: false
        }))
        .pipe(cssnano())                        // Сжимаем css (нужно попробовать другие плагины)
        .pipe(rename({ suffix: '.min' }))       // Добавляем суффикс .min к сжатым файлам
        .pipe(plumber.stop())                   // Возвращаем стандартный обработчик
        .pipe(gulp.dest(path.src.d_css))        // Выгружаем результата в папку src/css
        .pipe(connect.reload());                // перезагружаем страницу
});

// *** Собираем CSS библиотек, у которых нет SASS, и уже откомпилированные библиотеки в кучу, сжимаем и в продакшен
gulp.task('css-process', gulp.series('sass', function () {
    if (path.src.css_vendor.length != 0){ // Если есть CSS библиотеки, для которых отсутствуют SASS
        gulp.src(path.src.css_vendor)     // то копируем их в папку src/css для дальнейшей сборки и сжатия
        .pipe(gulp.dest(path.src.d_css));
    }

    return gulp.src(path.src.f_css)             // Выбираем файлы для минификации (все сгенерированные файлы css)
        .pipe(concat('styles.css'))
        .pipe(cssnano())                        // Сжимаем
        .pipe(rename({ suffix: '.min' }))       // Добавляем суффикс .min
        .pipe(gulp.dest(path.build.html));       // Выгружаем в папку src/css
}));

// *** Собираем (куски) HTML файлы в единый файл
gulp.task('html-process', function () {
    return gulp.src(path.src.f_html)                   // Выберем файлы по нужному пути
        .pipe(rigger())                         // Прогоним через rigger (подкдлючаем различные куски в html)
        .pipe(gulp.dest(path.build.html))       // Сохраняем
        .pipe(connect.reload());                // Перезагружаем страницу
});

// *** Собираем скрипты в кучу и сжимаем
gulp.task('scripts-process', function () {
    return gulp.src(path.src.f_vendor)           // Берем JS файлы библиотек   
        .pipe(concat('bundle.min.js'))          // Собираем их в кучу в новом файле libs.min.js
        .pipe(uglify())                          // Сжимаем JS файл
        .pipe(gulp.dest(path.src.d_js));         // Выгружаем в папку src/js
});

// *** Сжатие картинок
gulp.task('img', function () {
    console.log("IMG");
    return gulp.src('src/img/**/*')               // Берем все изображения из src/img
        .pipe(cache(imagemin({                    // Сжимаем их с наилучшими настройками с учетом кеширования
            interlaced: true,
            progressive: true,
            optimizationLevel: 5,
            svgoPlugins: [{ removeViewBox: false }],
            use: [pngquant()]
        })))
        .pipe(gulp.dest('dist/img'));             // Выгружаем на продакшен
});

// *********************************************************************************************
// *** Следилка за изменениями файлов
gulp.task('watch', gulp.series('sass', 'scripts-process', function () {
    console.log("WATCH");
    gulp.watch(path.watch.sass, gulp.series('sass'));          // При изменениях в Sass - компилируем
    //gulp.watch(path.watch.css, notifyLiveReload);   // Если изменили css - уведомляем браузер
    gulp.watch(path.watch.html, gulp.series('html-process'));  // Если изменили html - уведомляем браузер
    gulp.watch(path.watch.js, gulp.series('scripts-process'));    // Если изменили js - уведомляем браузер
    return;
}));

// *********************************************************************************************
// *** ЗАДАЧА ПО УМОЛЧАНИЮ (следим за файлами в SRC и обновляем браузер
gulp.task('default', gulp.parallel('watch', 'lrserver'));




// *********************************************************************************************
// *** СОЗДАЕМ ПРОЕКТ В ПРОДАКШН
gulp.task('build', gulp.parallel('sass', 'scripts-process', 'img', function () {

    var buildCss = gulp.src([                   // Переносим библиотеки в продакшен
        path.src.d_css + 'main.min.css',
        path.src.d_css + 'libs.min.css'
    ]).pipe(gulp.dest(path.build.css));

    var buildFonts = gulp.src(path.src.f_fonts) // Переносим шрифты в продакшен
        .pipe(gulp.dest(path.build.fonts));

    var buildJs = gulp.src(path.src.d_js + 'bundle.min.js')       // Переносим минифицированные скрипты в продакшен
        .pipe(gulp.dest(path.build.js));

    var buildsImg = gulp.src(path.src.f_img)    // Переносим картинки в продакшен
        .pipe(imagemin({ //Сожмем их
            progressive: true, //сжатие .jpg
            svgoPlugins: [{ removeViewBox: false }], //сжатие .svg
            interlaced: true, //сжатие .gif
            optimizationLevel: 3, //степень сжатия от 0 до 7
            use: [pngquant()]
        }))
        .pipe(gulp.dest(path.build.img));      //выгрузим в build

    var buildHtml = gulp.src(path.src.f_html)   // Переносим HTML в продакшен
        .pipe(gulp.dest(path.build.html));
}));

gulp.task('rebuild', gulp.series('clean', 'clear', 'build'));
