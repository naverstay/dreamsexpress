$(function ($) {

    $('body').delegate('.val_btn.minus', 'click', function () {


        var val_cell = $(this).closest('.val_cell'),
            val = val_cell.find('.val'),
            new_val = Math.max(0, (val.val().replace(/\D*/, '') * 1) - 1);

        val.val(new_val);

        $(this).toggleClass('disabled', !new_val);

        return false;

    }).delegate('.val_btn.plus', 'click', function () {

        var val_cell = $(this).closest('.val_cell'),
            val = val_cell.find('.val'),
            new_val = (val.val().replace(/\D*/, '') * 1) + 1;

        val.val(new_val);

        val_cell.find('.minus').toggleClass('disabled', !new_val);

        return false;

    }).delegate('.cartUnitChange', 'click', function () {

        $(this).closest('.cartUnit').toggleClass('changing');

        return false;

    });

    // initMask();

});
