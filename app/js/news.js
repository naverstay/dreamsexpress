$(function ($) {

    var isotop = $('#grid');

    isotop.imagesLoaded(function () {

        fitNewsBlock();

        isotop.one('arrangeComplete', function () {
            if (isotop.is(':visible')) isotop.addClass('loaded');
        });

        isotop.isotope({
            layoutMode: 'packery',
            transitionDuration: 0,
            packery: {
                gutter: 0
            },
            itemSelector: '.box',
            percentPosition: true
        });

    });

});


function fitNewsBlock() {
    var sizer = $('.small.box'), maxH = 0;

    sizer.css('height', 'auto').each(function (ind) {
        maxH = Math.max(maxH, $(this).height());
    });

    sizer.css('height', maxH);

    $('.box.x2').css('height', parseInt(sizer.css('margin-bottom')) + 2 * sizer.height());

}

$(window).resize(function () {

    fitNewsBlock();

});