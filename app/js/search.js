var review_popup,
    filterForm,
    filterInput,
    last_filter,
    filter,
    filter_delay,
    filterResults,
    filterCounter,
    filterCounterTxt,
    filtering = false;

$(function ($) {

    filterForm = $('.filterForm');
    filterResults = $('.filterResults');
    filterCounter = $('.filterCounter');
    filterCounterTxt = $('.filterCounterTxt');

    initCatDropDown();

    initToddler();

    initMask();

    initReviewPopup();

    initFilter();

});

function initFilter() {
    $('.filterInput').on('keyup keydown change paste cut', function () {
        var filter = $(this).val();

        clearTimeout(filter_delay);

        if (!filter.length) {
            searchResults.html('');
            return;
        }

        filter_delay = setTimeout(function () {

            if (!filtering && filter != last_filter) {
                searching = true;
                last_filter = filter;
                filterFunc();
            }
        }, 1000);
    });
}

function filterFunc() {
    var data = filterForm.serialize(); // пoдгoтaвливaeм дaнныe

    console.log(data);

    $.ajax({ // инициaлизируeм ajax зaпрoс
        type: filterForm.attr('method'), // oтпрaвляeм в POST фoрмaтe, мoжнo GET
        url: filterForm.attr('action'), // путь дo oбрaбoтчикa, у нaс oн лeжит в тoй жe пaпкe
        dataType: 'json', // oтвeт ждeм в json фoрмaтe
        data: data, // дaнныe для oтпрaвки
        beforeSend: function (data) { // сoбытиe дo oтпрaвки

        },
        success: function (data) { // сoбытиe пoслe удaчнoгo oбрaщeния к сeрвeру и пoлучeния oтвeтa

            console.log(data['error']);

            renderFilterResult(data);

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

function renderFilterResult(data) {
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

    filterCounterTxt.text(plural(counter, 'Найден ', 'Найдено ', 'Найдено '));
    filterCounter.text(plural(counter, 'товар', 'товара', 'товаров', true));

    filterResults.html(items);
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
    var price_range = [0, 10000];
    var price_toddler = $('#price_toddler');
    var filter_price_min = $('#filter_price_min');
    var filter_price_max = $('#filter_price_max');

    if (!price_toddler.length) return;

    filter_price_min.on('change', function (e) {
        var new_val = parseInt((this.value).replace(/\D*/g, '') || 0), old_val = parseInt(price_toddler[0].noUiSlider.get()[0]);

        if (new_val != old_val) {
            price_toddler[0].noUiSlider.set([new_val, null]);
        }

        if (e.type.toLowerCase() == 'keyup') manual_update = true;

    });

    filter_price_max.on('change', function (e) {
        var new_val = parseInt((this.value).replace(/\D*/g, '') || 0), old_val = parseInt(price_toddler[0].noUiSlider.get()[1]);

        if (new_val != old_val) {
            price_toddler[0].noUiSlider.set([null, new_val]);
        }

        if (e.type.toLowerCase() == 'keyup') manual_update = true;

    });

    noUiSlider.create(price_toddler[0], {
        animationDuration: 0,
        step: 10,
        start: [150, 2000],
        range: {
            'min': price_range[0],
            'max': price_range[1]
        },
        connect: true
    });

    price_toddler[0].noUiSlider.on('update', function (values, handle) {

        if (!manual_update) {
            filter_price_min.val(parseInt(values[0]));
            filter_price_max.val(parseInt(values[1]));
        }

        manual_update = false;

    });
}

function formatNum(num) {
    return num.toString().replace(/\B(?=(?:\d{3})+(?!\d))/g, " ");
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

        firedEl.closest('.catParameter').removeClass('opened active');

        return false;
    });

    $('.catApply').on('click', function (e) {
        var firedEl = $(this);

        var param = firedEl.closest('.catParameter').removeClass('opened').addClass('active');

        return false;
    });

    body.on('click', function (e) {
        var target = $(e.target);

        if (!target.hasClass('catParameter') && !target.closest('.catParameter').length) {
            $('.catParameter').removeClass('opened');
        }
    });

}

