const { src, dest, parallel, series, watch } = require("gulp");
const htmlmin = require("gulp-htmlmin");
const sass = require("gulp-sass")(require("sass"));
const notify = require("gulp-notify");
const autoprefixer = require("gulp-autoprefixer");
const rename = require("gulp-rename");
const sourcemaps = require("gulp-sourcemaps");
const cleanCSS = require("gulp-clean-css");
const browserSync = require("browser-sync").create();
const fileinclude = require("gulp-file-include");
const svgSprite = require("gulp-svg-sprite");
const del = require("del");
const webpack = require("webpack");
const webpackStream = require("webpack-stream");
const uglify = require("gulp-uglify-es").default;
const babel = require("gulp-babel");
const concat = require("gulp-concat");
const newer = require("gulp-newer");
const imagemin = require("gulp-imagemin");
// gulp-sourcemaps, gulp-rename,gulp-autoprefixer,gulp-clean-css, brouser-sync

// !styles
const styles = () => {
  return src("./src/scss/**/*.scss") // исходная пака
    .pipe(sourcemaps.init()) // ссылка на неминифицированный файл, а исходный, для лучшего восприятия и дебаггинга
    .pipe(sass({ outputStyle: "expanded" }).on("error", notify.onError())) // преобразование в css и показ ошибок
    .pipe(rename({ suffix: ".min" })) //   добавление префикса min к названию
    .pipe(autoprefixer({ cascade: false })) // для установки префиксов для разных браузеров например webkit
    .pipe(cleanCSS({ lavel: 2 })) // минимизация
    .pipe(sourcemaps.write(".")) //записывание настроек в sourcemaps
    .pipe(dest("./app/css/")) // конечная папка
    .pipe(browserSync.stream()); //отслеживание в реальном времени
};
//! html
const htmlInclude = () => {
  return src(["./src/index.html"]) // синтаксис в документации fileinclude
    .pipe(htmlmin({ collapseWhitespace: true })) //минимизация
    .pipe(
      // для подключения модулей html @@include("./test.html")
      fileinclude({
        prefix: "@@",
        basepath: "@file",
      })
    )
    .pipe(dest("./app"))
    .pipe(browserSync.stream()); //отслеживание в реальном времени
};
// !scripts
const scripts = () => {
  return src(["./src/scripts/main.js"])
    .pipe(
      webpackStream({
        output: {
          filename: "main.js",
        },
        module: {
          rules: [
            {
              test: /\.m?js$/,
              exclude: /node_modules/,
              use: {
                loader: "babel-loader",
                options: {
                  presets: [["@babel/preset-env", { targets: "defaults" }]],
                },
              },
            },
          ],
        },
      })
    )

    .pipe(sourcemaps.init())
    .pipe(babel({ presets: ["@babel/env"] })) //компилятор переписывает ES6 в ES5 для запуска в старых браузерах
    .pipe(uglify().on("error", notify.onError()))
    .pipe(concat("main.min.js"))
    .pipe(sourcemaps.write("."))
    .pipe(dest("./app/js"))
    .pipe(browserSync.stream());
};

// !img
const imgToApp = () => {
  return src([
    // "./src/img/**.jpg",
    // "./src/img/**.png",
    // "./src/img/**.jpeg",
    // "./src/img/**.svg",
    "src/img/**",
  ])
    .pipe(newer("./app/img")) //позволяет сжимать только новые файлы, не трогая уже сжатые
    .pipe(imagemin({ progressive: true }))
    .pipe(dest("./app/img"));
};

// ! функция удаления
const clean = () => {
  return del(["app/*"]);
};
//! функция слежения за файлами
const watchFiles = () => {
  // из документации browserSync инициализация утилиты. Принцип лайвсервера
  browserSync.init({
    server: {
      baseDir: "./app",
    },
  });

  watch("./src/scss/**/*.scss", styles); //функция слежения scss
  watch("./src/index.html", htmlInclude); //функция слежения html
  watch("./src/img/**.jpg", imgToApp);
  watch("./src/img/**.png", imgToApp);
  watch("./src/img/**.jpeg", imgToApp);
  watch("./src/scripts/**/*.js", scripts);
};

// таски
exports.watchFiles = watchFiles;
exports.styles = styles;
exports.htmlInclude = htmlInclude;
exports.imgToApp = imgToApp;

// дефолтная функция, запускающая последовательно функции изменения файлов и вотчер
//! для запуска в консоли команда gulp
exports.default = series(
  clean,
  parallel(htmlInclude, scripts, imgToApp),
  styles,
  watchFiles
);

// build=============================================================
//! для запуска в консоли команда gulp build
const stylesBuild = () => {
  return src("./src/scss/**/*.scss") // исходная пака
    .pipe(sass({ outputStyle: "expanded" }).on("error", notify.onError())) // преобразование в css и показ ошибок
    .pipe(rename({ suffix: ".min" })) //   добавление префикса min к названию
    .pipe(autoprefixer({ cascade: false })) // для установки префиксов для разных браузеров например webkit
    .pipe(cleanCSS({ lavel: 2 })) // минимизация
    .pipe(dest("./app/css/")); // конечная папка
};

const scriptsBuild = () => {
  return src(["./src/scripts/main.js"])
    .pipe(
      webpackStream({
        output: {
          filename: "main.js",
        },
        module: {
          rules: [
            {
              test: /\.m?js$/,
              exclude: /node_modules/,
              use: {
                loader: "babel-loader",
                options: {
                  presets: [["@babel/preset-env", { targets: "defaults" }]],
                },
              },
            },
          ],
        },
      })
    )

    .pipe(babel({ presets: ["@babel/env"] })) //компилятор переписывает ES6 в ES5 для запуска в старых браузерах
    .pipe(uglify().on("error", notify.onError()))
    .pipe(concat("main.min.js"))
    .pipe(dest("./app/js"));
};

exports.build = series(
  clean,
  parallel(htmlInclude, scriptsBuild, imgToApp),
  stylesBuild,
  watchFiles
);
