global.hostname = "localhost",  // domain
global.port = 80;               // port

var src_dir_name = 'src',               // папка, где мы пишем наш проект
    build_dir_name = 'build',           // в эту папку собирается окончательный вид проекта для продакшена
    vendor_dir_name = 'node_modules';   // папка, куда устанавливаются сторонние библиотеки


var path = {
    build: { //Тут мы укажем куда складывать готовые после сборки файлы
        html:           build_dir_name,
        js:             build_dir_name + '/js/',
        css:            build_dir_name + '/css/',
        img:            build_dir_name + '/img/',
        fonts:          build_dir_name + '/fonts/',
        htaccess:       build_dir_name,
    },
    src: { //Пути откуда брать исходники
        d_html:           src_dir_name + '/',                 // Директория для HTML файлов
        f_html:           src_dir_name + '/*.html',           // Синтаксис src/ *.html говорит gulp что мы хотим взять все файлы с расширением .html
        d_js:             src_dir_name + '/js/',              // Директория для JavaScripts
        f_js:             src_dir_name + '/js/[^_]*.js',      // все JS без подчеркивания
        f_sass:           src_dir_name + '/sass/**/*.*',      // любые файлы в любых подкатегориях
        d_css:            src_dir_name + '/css/',
        //f_cssVendor:      src_dir_name + '/css/vendor/*.*', // Если мы хотим файлы библиотек отдельно хранить то раскоментить строчку
        d_img:            src_dir_name + '/img/',             // Папка img
        f_img:            src_dir_name + '/img/**/*.*',       //Синтаксис img/**/*.* означает - взять все файлы всех расширений из папки и из вложенных каталогов
        d_fonts:          src_dir_name + '/fonts/',
        f_fonts:          src_dir_name + '/fonts/**/*.*',
        d_vendor:         vendor_dir_name + '/',
        f_vendor:         [
            vendor_dir_name  + '/jquery/dist/jquery.min.js',           // Берем jQuery
            vendor_dir_name  + '/bootstrap/dist/js/bootstrap.min.js',  // Берем BootstrapJS
            vendor_dir_name  + '/popper.js/dist/umd/popper.min.js',    // Берем PopperJS
        ]
    },
    watch: { //Тут мы укажем, за изменением каких файлов мы хотим наблюдать
        sass:             src_dir_name + '/sass/**/*.*',
        html:             src_dir_name + '/**/*.html',
        js:               src_dir_name + '/js/**/*.js',
        css:              src_dir_name + '/css/**/*.*',
        img:              src_dir_name + '/css/images/**/*.*',
        fonts:            src_dir_name + '/fonts/**/*.*',
    },
    clean:      './' + build_dir_name,   //директории которые могут очищаться
    outputDir:  './' + build_dir_name    //исходная корневая директория для запуска минисервера
};


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
    plumber = require("gulp-plumber");          //предохранитель для остановки гальпа


// *** live reload task
//TODO: get new live reload

// *** Чистим кеш картинок
gulp.task('clear', function (callback) {
    return cache.clearAll();
})

// *** Чистим каталог дистрибутива
gulp.task('clean', function (cb) {
    rimraf(path.clean, cb);
});

// *** Компилируем sass и сжимаем
gulp.task('sass', function () {
    return gulp.src(path.src.f_sass)            // Берем источник
        .pipe(plumber())                        // Предохраняем от вылета Gulp
        .pipe(sass().on('error', sass.logError)) // Преобразуем Sass в CSS посредством gulp-sass (и боремся с вылетом при ошибках)
        .pipe(autoprefixer({                    // Добавляем браузерныен приставкик свойствам
            browsers: ['last 3 versions'],      // Добавляем префиксы для браузеров последних 3 версий (-webkit, -o, -moz, ...)
            cascade: false
        }))
        .pipe(cssnano())                        // Сжимаем
        .pipe(rename({suffix: '.min'}))         // Добавляем суффикс .min
        .pipe(plumber.stop())                   // Возвращаем стандартный обработчик
        .pipe(gulp.dest(path.src.d_css))        // Выгружаем результата в папку src/css
});

// *** Собираем CSS библиотек в кучу и сжимаем
gulp.task('css-process', gulp.series('sass', function () {
    return gulp.src([                           // Выбираем файл для минификации
        path.src.d_css + '/libs.css',
        path.src.d_css + '/main.css'])
        .pipe(cssnano())                        // Сжимаем
        .pipe(rename({suffix: '.min'}))         // Добавляем суффикс .min
        .pipe(gulp.dest(path.src.d_css));       // Выгружаем в папку src/css
}));

// *** Собираем скрипты в кучу и сжимаем
gulp.task('scripts-process', function () {
    return gulp.src(path.src.f_vendor )
        .pipe(concat('libs.min.js'))             // Собираем их в кучу в новом файле libs.min.js
        .pipe(uglify())                          // Сжимаем JS файл
        .pipe(gulp.dest(path.src.d_js));         // Выгружаем в папку src/js
});

// *** Сжатие картинок
gulp.task('img', function () {
    return gulp.src('src/img/**/*')               // Берем все изображения из src/img
        .pipe(cache(imagemin({                    // Сжимаем их с наилучшими настройками с учетом кеширования
            interlaced: true,
            progressive: true,
            optimizationLevel: 5,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()]
        })))
        .pipe(gulp.dest('dist/img'));             // Выгружаем на продакшен
});

// *********************************************************************************************
// *** Следилка за изменениями файлов
gulp.task('watch', gulp.series('css-process','scripts-process', function() {
    gulp.watch(path.watch.sass, ['sass']);          // При изменениях в Sass - компилируем
    gulp.watch(path.watch.css, notifyLiveReload);   // Если изменили css - уведомляем браузер
    gulp.watch(path.watch.html, notifyLiveReload);  // Если изменили html - уведомляем браузер
    gulp.watch(path.watch.js, notifyLiveReload);    // Если изменили js - уведомляем браузер
}));

// *********************************************************************************************
// *** ЗАДАЧА ПО УМОЛЧАНИЮ (следим за файлами в SRC и обновляем браузер
gulp.task('default', gulp.series('express', 'livereload', 'watch'));




// *********************************************************************************************
// *** СОЗДАЕМ ПРОЕКТ В ПРОДАКШН
gulp.task('build', gulp.parallel('css-process', 'scripts-process', 'img', function () {

    var buildCss = gulp.src([                   // Переносим библиотеки в продакшен
        path.src.d_css + 'main.min.css',
        path.src.d_css + 'libs.min.css'
    ]).pipe(gulp.dest(path.build.css));

    var buildFonts = gulp.src(path.src.f_fonts) // Переносим шрифты в продакшен
        .pipe(gulp.dest(path.build.fonts));

    var buildJs = gulp.src(path.src.f_js)       // Переносим минифицированные скрипты в продакшен
        .pipe(gulp.dest(path.build.js));

    var buildsImg = gulp.src(path.src.f_img)    // Переносим картинки в продакшен
        .pipe(imagemin({ //Сожмем их
            progressive: true, //сжатие .jpg
            svgoPlugins: [{removeViewBox: false}], //сжатие .svg
            interlaced: true, //сжатие .gif
            optimizationLevel: 3, //степень сжатия от 0 до 7
            use: [pngquant()]
        }))
        .pipe(gulp.dest(path.build.img));      //выгрузим в build

    var buildHtml = gulp.src(path.src.f_html)   // Переносим HTML в продакшен
        .pipe(gulp.dest(path.build.html));
}));

gulp.task('rebuild', gulp.series('clean','clear', 'build'));
