var mainSlider, hitSlider, popSlider;

$(function ($) {

  initMainSlider();

  initHitSlider();

  initPopSlider();

});

function initMainSlider() {

  mainSlider = $('.mainSlider').slick({
    dots: true,
    mobileFirst: true,
    infinite: false,
    arrows: true,
    //variableWidth: true,
    speed: 600,
    zIndex: 1,
    initialSlide: 0,
    //centerPadding: '0',
    slide: '.mainSlider .slide',
    prevArrow: '.mainSlider .slide_prev',
    nextArrow: '.mainSlider .slide_next',
    //appendDots: sld.parent().find('.slider_dots'),
    slidesToShow: 1,
    touchThreshold: 10
  });
}

function initHitSlider() {

  hitSlider = $('.hitSlider .hit_slider').slick({
    dots: false,
    mobileFirst: true,
    infinite: false,
    arrows: true,
    autoplay: true,
    autoplaySpeed: 3000,
    //centerMode: true,
    //variableWidth: true,
    speed: 600,
    zIndex: 1,
    initialSlide: 0,
    //centerPadding: '0',
    slide: '.hitSlider .slide',
    prevArrow: '.hitSlider .slide_prev',
    nextArrow: '.hitSlider .slide_next',
    //appendDots: sld.parent().find('.slider_dots'),
    slidesToShow: 2,
    touchThreshold: 10,
    responsive: [
      {
        breakpoint: 670 - 1,
        settings: {
          //slidesToScroll: 3,
          slidesToShow: 3
        }
      },
      {
        breakpoint: 960 - 1,
        settings: {
          //slidesToScroll: 4,
          slidesToShow: 4
        }
      },
      {
        breakpoint: 1440 - 1,
        settings: {
          //slidesToScroll: 4,
          slidesToShow: 6
        }
      },
      {
        breakpoint: 1640 - 1,
        settings: {
          //slidesToScroll: 4,
          slidesToShow: 7
        }
      },
      {
        breakpoint: 1800 - 1,
        settings: {
          //slidesToScroll: 4,
          slidesToShow: 8
        }
      },
      {
        breakpoint: 2000 - 1,
        settings: {
          //slidesToScroll: 4,
          slidesToShow: 9
        }
      }
    ]
  });
}

function initPopSlider() {

  popSlider = $('.popSlider .hit_slider').slick({
    dots: false,
    mobileFirst: true,
    infinite: false,
    arrows: true,
    centerMode: false,
    variableWidth: true,
    speed: 600,
    zIndex: 1,
    initialSlide: 0,
    //centerPadding: '0',
    slide: '.popSlider .slide',
    prevArrow: '.popSlider .slide_prev',
    nextArrow: '.popSlider .slide_next',
    //appendDots: sld.parent().find('.slider_dots'),
    //slidesToShow: 2,
    touchThreshold: 10

  });
}
