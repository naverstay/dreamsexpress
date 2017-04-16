var review_popup,
    filterForm,
    filterInput,
    last_filter,
    filter,
    filter_delay,
    filtering = false;

$(function ($) {

    filterInput = $('.filterInput');
    filterForm = $('.filterForm');

    initCatDropDown();

    initToddler();

    // initMask();

    initReviewPopup();

    initFilter();

});

function initFilter() {
    filterInput.on('keyup keydown change paste cut', function () {
        var filter = $(this);

        clearTimeout(filter_delay);

        // if (!filter.length) {
        //     searchResults.html('');
        //     return;
        // }

        filter_delay = setTimeout(function () {
            filter.closest('form').trigger('submit');
        }, 1000);
    });

    filterForm.on('submit', function () {
        var form = $(this), filter = form.find('.filterInput').val();

        if (!filtering) {
            clearTimeout(filter_delay);

            filter_delay = setTimeout(function () {
                searching = true;
                last_filter = filter;
                filterFunc(form);
            }, 1000);
        }

        return false;

    }).each(function (ind) {
        /*var form = $(this), filter = form.find('.filterInput');

        form.find('input, select').on('keyup keydown change paste cut', function () {
            var el = $(this);

            el.closest('form').trigger('submit');
        });*/
    });
}

function filterFunc(form) {
    var data = form.serialize(); // пoдгoтaвливaeм дaнныe

    console.log(data);

    $.ajax({ // инициaлизируeм ajax зaпрoс
        type: form.attr('method'), // oтпрaвляeм в POST фoрмaтe, мoжнo GET
        url: form.attr('action'), // путь дo oбрaбoтчикa, у нaс oн лeжит в тoй жe пaпкe
        dataType: 'json', // oтвeт ждeм в json фoрмaтe
        data: data, // дaнныe для oтпрaвки
        beforeSend: function (data) { // сoбытиe дo oтпрaвки

        },
        success: function (data) { // сoбытиe пoслe удaчнoгo oбрaщeния к сeрвeру и пoлучeния oтвeтa

            renderFilterResult(data, form);

            /*if (data['error']) { // eсли oбрaбoтчик вeрнул oшибку
                alert(data['error']); // пoкaжeм eё тeкст
            } else { // eсли всe прoшлo oк
                alert('Письмo oтврaвлeнo! Чeкaйтe пoчту! =)'); // пишeм чтo всe oк
            }*/
        },
        error: function (xhr, ajaxOptions, thrownError) { // в случae нeудaчнoгo зaвeршeния зaпрoсa к сeрвeру

            console.log(xhr, ajaxOptions, thrownError);

            // alert(xhr.status); // пoкaжeм oтвeт сeрвeрa
            // alert(thrownError); // и тeкст oшибки
        },
        complete: function (data) { // сoбытиe пoслe любoгo исхoдa
            filtering = false;
        }
    });
}

function renderFilterResult(data, form) {
    var items = '', counter = 0;

    $.each(data, function (index, item) {
        console.log(item);

        items +=
            '<li>' +
            '<div class="product_item">' +
            '<a href="products/' + item._id + '" class="product_img">' +
            '<img src="' + item.main_img + '">' +
            (item.hover_img ? '<div class="hover_img prod_hover"><img src="' + item.hover_img + '"></div>' : '') +
            '<div class="product_hit">Хит продаж</div>' +
            '<div class="product_share_holder">' +
            '<span class="prod_hover prod_fav favBtn"></span>' +
            '<div class="product_share">- 30%</div>' +
            '</div>' +
            '<div class="product_q_review violette_btn prod_hover openReview mob_hidden">Быстрый просмотр</div>' +
            '</a>' +
            '<h3 class="product_caption">' + item.name + '</h3>' +
            '<div class="product_price">' +
            (item.old_price ? '<span class="old_price">' + formatPrice(item.old_price) + '<span> грн.</span></span>' : '') +
            '<span class="new_price">' + formatPrice(item.price) + '<span> грн.</span></span>' +
            '</div>' +
            '<div class="product_item_overview prod_hover">' +
            '<p>Цвета и размеры в наличии</p>' +
            '<ul class="prod_colors">' +
            colorRender(item.colors) +
            '</ul>' +
            '<div class="prod_sizes">' + item.sizes + '</div>' +
            '</div>' +
            '</div>' +
            '</li>';

        counter++;
    });

    form.find('.filterCounterTxt').text(plural(counter, 'Найден ', 'Найдено ', 'Найдено '));
    form.find('.filterCounter').text(plural(counter, 'товар', 'товара', 'товаров', true));

    form.find('.filterResults').html(items);
}

function initReviewPopup() {

    review_popup = $('#review_popup').dialog({
        autoOpen: false,
        modal: true,
        closeOnEscape: true,
        closeText: '',
        dialogClass: 'no_close_mod dialog_g_size_2',
        //appendTo: '.wrapper',
        width: 750,
        draggable: true,
        collision: "fit",
        position: {my: "top center", at: "top center", of: window},
        open: function (event, ui) {
            body.addClass('modal_opened overlay_v2');
        },
        close: function (event, ui) {
            body.removeClass('modal_opened overlay_v2');
        }
    });

    body.delegate('.openReview', 'click', function () {
        review_popup.dialog('open');

        return false;
    });
}

function initToddler() {
    var manual_update = true;
    var toddler_update = false;
    var price_toddler = $('.priceToddler');
    var filter_price_min = $('.filterMin');
    var filter_price_max = $('.filterMax');

    if (!price_toddler.length) return;

    filter_price_min.on('change', function (e) {
        var new_val = parseInt((this.value).replace(/\D*/g, '') || 0), old_val = parseInt(price_toddler[0].noUiSlider.get()[0]);

        if (new_val != old_val) {
            $(this).closest('.catParameter').find('.priceToddler')[0].noUiSlider.set([new_val, null]);
        }

        if (e.type.toLowerCase() == 'keyup') manual_update = true;

    });

    filter_price_max.on('change', function (e) {
        var new_val = parseInt((this.value).replace(/\D*/g, '') || 0), old_val = parseInt(price_toddler[0].noUiSlider.get()[1]);

        if (new_val != old_val) {
            $(this).closest('.catParameter').find('.priceToddler')[0].noUiSlider.set([null, new_val]);
        }

        if (e.type.toLowerCase() == 'keyup') manual_update = true;

    });

    price_toddler.each(function (ind) {
        var tdlr = $(this);

        var price_range = [(tdlr.attr('data-toddler-min') * 1) || 0, (tdlr.attr('data-toddler-max') * 1) || 20000];

        noUiSlider.create(tdlr[0], {
            animationDuration: 0,
            step: 10,
            start: [price_range[0], price_range[1]],
            range: {
                'min': price_range[0],
                'max': price_range[1]
            },
            connect: true
        });

        tdlr[0].noUiSlider.on('update', function (values, handle, e, w) {
            if (!manual_update) {
                $(this.target).closest('.catParameter').find('.filterMin').val(parseInt(values[0]));
                $(this.target).closest('.catParameter').find('.filterMax').val(parseInt(values[1]));
            }

            manual_update = false;
        });
    });
}

function initCatDropDown() {

    $('.dropdownBtn').on('click', function (e) {
        var firedEl = $(this);
        $('.catParameter').removeClass('opened');
        firedEl.closest('.catParameter').addClass('opened');
        return false;
    });

    $('.catReset').on('click', function (e) {
        var firedEl = $(this);

        var param = firedEl.closest('.catParameter').removeClass('opened active');

        param.find('.catList input').each(function (ind) {
            if ((this.type == 'checkbox' || this.type == 'checkbox')) {
                this.checked = false;
            }
        });

        param.find('.priceToddler').each(function (ind) {
            var tdlr = $(this);

            tdlr[0].noUiSlider.set([tdlr.attr('data-toddler-min') * 1, tdlr.attr('data-toddler-max') * 1])
        });

        var min = param.find('.filterMin');

        min.attr('data-name', min.attr('name'));

        min.removeAttr('name');

        var max = param.find('.filterMax');

        max.attr('data-name', max.attr('name'));

        max.removeAttr('name');

        param.find('.catVal').text(param.find('.catList').attr('data-default'));

        firedEl.closest('form').trigger('submit');

        return false;
    });

    $('.catApply').on('click', function (e) {
        var firedEl = $(this), val = '';

        var param = firedEl.closest('.catParameter').removeClass('opened');

        param.find('.catList input').each(function (ind) {
            var inp = $(this);
            if ((this.type == 'checkbox' || this.type == 'checkbox') && this.checked) {
                val += ', ' + inp.next('.check_text').text();
            }
            if ((this.type == 'text')) {
                val += '- ' + inp.val() + ' ';
            }
        });

        if (val.length) {
            param.addClass('active').find('.catVal').text(val.length ? val.slice(2) : param.find('.catList').attr('data-default'));

            var min = param.find('.filterMin');

            min.attr('name', min.attr('data-name'));

            var max = param.find('.filterMax');

            max.attr('name', max.attr('data-name'));

            firedEl.closest('form').trigger('submit');
        }

        return false;
    });

    body.on('click', function (e) {
        var target = $(e.target);

        if (!target.hasClass('catParameter') && !target.closest('.catParameter').length) {
            $('.catParameter').removeClass('opened');
        }
    });

}

