var gulp = require('gulp');
    gutil = require('gulp-util'),
    ftp = require('gulp-ftp'),
    // sass = require('gulp-ruby-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    minifycss = require('gulp-minify-css'),
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    imagemin = require('gulp-imagemin'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    notify = require('gulp-notify'),
    cache = require('gulp-cache'),
    livereload = require('gulp-livereload'),
    del = require('del'),
    rev = require('gulp-rev'),
    revCollector = require('gulp-rev-collector'),
    runSequence = require('gulp-run-sequence');
var ftpConfig={ftp_test:{},ftp_bate:{},ftp_business:{}};
//自动化部署环境会填充系统环境变量，当有系统环境变量时，使用系统环境变量
var config = {};
if(process.env.ftp_host)config.host=process.env.ftp_host;
if(process.env.ftp_user)config.user=process.env.ftp_user;
if(process.env.ftp_pass)config.pass=process.env.ftp_pass;
if(process.env.production){
  var production=process.env.production;
  console.log('production:'+production);
  if(production=="debug"){
    ftpConfig.ftp_test=config;
  }else if(production=="beta"){
    ftpConfig.ftp_bate=config;
  }else if(production=="release"){
    ftpConfig.ftp_business=config;
  }else {
    console.error('error production environment,use debug beta or release');
  }
}
//配置文件优先级更高
try{
  ftpConfig = require('./ftp.json');
}catch(ex){
  console.log(ex);
}


// Clean
gulp.task('clean', function() {
    return del(['dist/*'])
});

//copy html,image,template
gulp.task('copyindex', function() {
    return gulp.src(['index.html']).pipe(gulp.dest('dist/'));
});
gulp.task('copyimages', function() {
    return gulp.src(['images/**']).pipe(gulp.dest('dist/images'));
});
gulp.task('copytemplate', function() {
  if(process.env.production){
    if(process.env.production=='debug'){
      return gulp.src(['template/**']).pipe(gulp.dest('dist/template'));
    }
  }
  return gulp.src(['template/**', '!template/Home/home.html']).pipe(gulp.dest('dist/template'));
});
// gulp.task('copycss',function(){
//     return gulp.src(['css/**']).pipe(gulp.dest('dist/css'));
// });
// gulp.task('copyjs',function(){
//     return gulp.src(['js/**']).pipe(gulp.dest('dist/js'));
// });
//压缩拷贝js
gulp.task('uglifyjs', function() {
    return gulp.src(['js/*.js', '!js/webconfig.js'])
        .pipe(uglify())
        .pipe(gulp.dest('dist/js'));
});
// test webconfig配置
gulp.task('configtest', function() {
    return gulp.src(['dist/js/webconfig_test.js'])
        .pipe(rename('webconfig.js'))
        .pipe(gulp.dest('dist/js/'));
});
// beat webconfig配置
gulp.task('configbeat', function() {
    return gulp.src(['dist/js/webconfig_beat.js'])
        .pipe(rename('webconfig.js'))
        .pipe(gulp.dest('dist/js/'));
});
gulp.task('configbusiness', function() {
    return gulp.src(['dist/js/webconfig_business.js'])
        .pipe(rename('webconfig.js'))
        .pipe(gulp.dest('dist/js/'));
});

//css压缩拷贝
gulp.task('minifycss', function() {
    return gulp.src('css/*.css')
        .pipe(minifycss())
        .pipe(gulp.dest('dist/css'));
});


// 加hash
gulp.task('hashjs', function() {
    return gulp.src(['dist/js/*.js'])
        .pipe(rev())
        .pipe(gulp.dest('dist/js'))
        .pipe(rev.manifest()) //- 生成一个rev-manifest.json
        .pipe(gulp.dest('dist/js'));
});
gulp.task('hashcss', function() {
    return gulp.src(['dist/css/*.css'])
        // .pipe(gulp.dest('dist/js'))
        .pipe(rev())
        .pipe(gulp.dest('dist/css'))
        .pipe(rev.manifest())
        .pipe(gulp.dest('dist/css')) //- 生成一个rev-manifest.json
});
//hash替换
gulp.task('rev', function() {
    return gulp.src(['dist/**/*.json', 'dist/index.html']) //- 读取 rev-manifest.json 文件以及需要进行替换的文件
        .pipe(revCollector({
            replaceReved: true,
            dirReplacements: {
                'css': 'css/',
                'js': 'js/'
            }
        })) //- 替换后的文件输出的目录
        .pipe(gulp.dest('dist/'));
});
//ftp上传
gulp.task('ftp_bate', function() {
    return gulp.src('dist/**/*')
        .pipe(ftp(ftpConfig.ftp_bate))
        .pipe(gutil.noop());
});
gulp.task('ftp_test', function() {

    return gulp.src('dist/**/*')
        .pipe(ftp(ftpConfig.ftp_test))
        .pipe(gutil.noop());
});
gulp.task('ftp_business', function() {
    return gulp.src('dist/**/*')
        .pipe(ftp(ftpConfig.ftp_business))
        .pipe(gutil.noop());
});
gulp.task('prod_bate', function(cb) {
    runSequence('clean', ['minifycss', 'uglifyjs', 'copytemplate', 'copyindex'], ['hashcss', 'hashjs','configbeat'], 'rev', 'ftp_bate', cb);
});
gulp.task('prod_test', function(cb) {
    runSequence('clean', ['minifycss', 'uglifyjs', 'copytemplate', 'copyindex'], ['hashcss', 'hashjs','configtest'], 'rev', 'ftp_test', cb);
});
gulp.task('prod_business', function(cb) {
    runSequence('clean', ['minifycss', 'uglifyjs', 'copytemplate', 'copyindex','copyimages'], ['hashcss', 'hashjs','configbusiness'], 'rev','ftp_business', cb);
});
// Default task
gulp.task('help', function() {
    console.log('   gulp clean          清理文件');
    console.log('   gulp minifycss      拷贝压缩css');
    console.log('   gulp uglifyjs       拷贝压缩js');
    console.log('   gulp copytemplate   拷贝html文件');
    console.log('   gulp configtest     拷贝test服务器webconfig配置');
    console.log('   gulp configbeat     拷贝beat服务器webconfig配置');
    console.log('   gulp hashcss        hash重命名css文件');
    console.log('   gulp hashjs         hash重命名js文件');
    console.log('   gulp rev            替换hash文件名');
    console.log('   gulp ftp_bate       bate ftp上传');
    console.log('   gulp ftp_bate       test ftp上传');
    console.log('   gulp prod_bate      bate 文件流');
    console.log('   gulp prod_test      test 文件流');

});
gulp.task('default', function() {
    gulp.start('help');
});

// Styles
// gulp.task('css', function() {
//   return gulp.src('css/*.scss')
//     // .pipe(sass({ style: 'expanded', }))
//     .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
//     .pipe(gulp.dest('dist/css'))
//     .pipe(rename({ suffix: '.min' }))
//     .pipe(minifycss())
//     .pipe(gulp.dest('dist/css'))
//     .pipe(notify({ message: 'Styles task complete' }));
// });
// gulp.task('testConcat',['copyjs'], function () {
//     gulp.src(['js/testwebconfig.js','js/config_transaction.js'])
//         .pipe(concat('config_transaction.js'))//合并后的文件名
//         .pipe(gulp.dest('dist/js'));
// });
// gulp.task('betaConcat', function () {
//     gulp.src(['js/beatwebconfig.js','js/config_transaction.js'])
//         .pipe(concat('config_transaction.js'))//合并后的文件名
//         .pipe(gulp.dest('dist/js'));
// });
// // Default task
// gulp.task('default', ['clean'], function() {
//     gulp.start('css', 'js', 'ftp');
// });

// Watch
// gulp.task('watch', function() {
//   // Watch .scss files
//   gulp.watch('css/*.scss', ['css']);
//   // Watch .js files
//   gulp.watch('js/*.js', ['js']);
//   // Watch image files
//   // gulp.watch('src/images/**/*', ['images']);
//   // Create LiveReload server
//   livereload.listen();
//   // Watch any files in dist/, reload on change
//   gulp.watch(['dist/**']).on('change', livereload.changed);
// });
