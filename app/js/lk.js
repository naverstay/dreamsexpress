$(function ($) {

    $('.orderExpandBtn').on ('click', function () {
        $(this).closest('.orderRow').toggleClass('opened').next('.orderExpandRow').slideToggle(500).find('.order_row').toggleClass('opened');


        return false;
    });

});
