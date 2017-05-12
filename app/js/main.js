var body, html, doc, wnd, search_delay,
    closeMenuTimer,
    searchResults,
    qSearchForm,
    cart_info_timeout,
    last_search = '',
    searching = false,
    favoriting = false,
    callback_popup,
    auth_popup,
    fail_popup,
    success_popup,
    quick_search_popup,
    add2cart_popup,
    recovery_popup,
    inputMaskEvents = {
        "oncomplete": function (ev) {
            // console.log(ev, this);
            $(this).addClass('_complete').removeClass('_incomplete');

        },
        "onincomplete": function (ev) {
            // console.log(ev, this);
            $(this).addClass('_incomplete').removeClass('_complete');
        },
        "oncleared": function (ev) {
            // console.log(ev, this);
            $(this).removeClass('_complete');
        }
    };

$(function ($) {

    html = $('html');
    body = $('body');
    searchResults = $('.searchResults');
    qSearchForm = $('.qSearchForm');

    body
        .delegate('.openMobMenu', 'click', function () {
            clearTimeout(closeMenuTimer);

            if (body.hasClass('menu_opened')) {
                closeMenuTimer = setTimeout(function () {
                    body.removeClass('icon_close');
                }, 250);
            }

            body.addClass('icon_close').toggleClass('menu_opened');
            return false;

        })
        .delegate('.openFav', 'click', function () {

            body.toggleClass('fav_opened');
            html.toggleClass('no_scroll');
            return false;

        })
        .delegate('.rmProdPreview', 'click', function () {
            var firedEl = $(this);

            firedEl.closest('.prodPreviewItem').remove();

            return false;

        })
        .delegate('.sortBtn', 'click', function () {
            var firedEl = $(this), inp = $(firedEl.addClass('active').attr('data-target'));

            if (inp.val() == 'desc') {
                firedEl.find('.sort_icon').addClass('i-sort-asc').removeClass('i-sort-desc');
                $(firedEl.addClass('active').attr('data-target')).val('asc');
            } else {
                firedEl.find('.sort_icon').addClass('i-sort-desc').removeClass('i-sort-asc');
                $(firedEl.addClass('active').attr('data-target')).val('desc');
            }

            return false;

        })
        .delegate('.orderExpandBtn', 'click', function () {
            $(this).closest('.orderRow').toggleClass('opened').next('.orderExpandRow').slideToggle(500).find('.order_row').toggleClass('opened');

            return false;

        })
        .delegate('.rmFavBtn', 'click', function () {
            var firedEl = $(this);

            if (!favoriting) {
                favoriting = true;

                $.ajax({ // инициaлизируeм ajax зaпрoс
                    type: "POST", // oтпрaвляeм в POST фoрмaтe, мoжнo GET
                    url: "/fav_rm", // путь дo oбрaбoтчикa, у нaс oн лeжит в тoй жe пaпкe
                    dataType: 'json', // oтвeт ждeм в json фoрмaтe
                    data: {id: firedEl.attr('data-id')}, // дaнныe для oтпрaвки
                    beforeSend: function (data) { // сoбытиe дo oтпрaвки

                    },
                    success: function (data) { // сoбытиe пoслe удaчнoгo oбрaщeния к сeрвeру и пoлучeния oтвeтa

                        if (data.needAuth) {
                            setTimeout(function () {
                                all_dialog_close_gl();
                                auth_popup.dialog('open');
                            }, 1);
                        }

                        if (data.redirectTo) {
                            setTimeout(function () {
                                window.location = data.redirectTo;
                            }, 1);
                        }

                        // console.log(data);

                        updateFav(data);

                    },
                    error: function (xhr, ajaxOptions, thrownError) { // в случae нeудaчнoгo зaвeршeния зaпрoсa к сeрвeру

                        console.log(xhr, ajaxOptions, thrownError);

                        // alert(xhr.status); // пoкaжeм oтвeт сeрвeрa
                        // alert(thrownError); // и тeкст oшибки
                    },
                    complete: function (data) { // сoбытиe пoслe любoгo исхoдa
                        favoriting = false;
                    }
                });
            }

            return false;

        })
        .delegate('.clearFavBtn', 'click', function () {

            if (!favoriting) {
                favoriting = true;

                $.ajax({ // инициaлизируeм ajax зaпрoс
                    type: "POST", // oтпрaвляeм в POST фoрмaтe, мoжнo GET
                    url: "/fav_clear", // путь дo oбрaбoтчикa, у нaс oн лeжит в тoй жe пaпкe
                    dataType: 'json', // oтвeт ждeм в json фoрмaтe
                    data: {id: ''}, // дaнныe для oтпрaвки
                    beforeSend: function (data) { // сoбытиe дo oтпрaвки

                    },
                    success: function (data) { // сoбытиe пoслe удaчнoгo oбрaщeния к сeрвeру и пoлучeния oтвeтa

                        // console.log(data);

                        if (data.needAuth) {
                            setTimeout(function () {
                                all_dialog_close_gl();
                                auth_popup.dialog('open');
                            }, 1);
                        }

                        if (data.redirectTo) {
                            setTimeout(function () {
                                window.location = data.redirectTo;
                            }, 1);
                        }

                        $('.favUnit').remove();

                        updateFav(data);

                    },
                    error: function (xhr, ajaxOptions, thrownError) { // в случae нeудaчнoгo зaвeршeния зaпрoсa к сeрвeру

                        console.log(xhr, ajaxOptions, thrownError);

                        // alert(xhr.status); // пoкaжeм oтвeт сeрвeрa
                        // alert(thrownError); // и тeкст oшибки
                    },
                    complete: function (data) { // сoбытиe пoслe любoгo исхoдa
                        favoriting = false;
                    }
                });
            }

            return false;

        })
        .delegate('.favBtn', 'click', function () {
            var firedEl = $(this);

            if (!favoriting) {
                favoriting = true;

                $.ajax({ // инициaлизируeм ajax зaпрoс
                    type: "POST", // oтпрaвляeм в POST фoрмaтe, мoжнo GET
                    url: "/fav", // путь дo oбрaбoтчикa, у нaс oн лeжит в тoй жe пaпкe
                    dataType: 'json', // oтвeт ждeм в json фoрмaтe
                    data: {id: firedEl.attr('data-id')}, // дaнныe для oтпрaвки
                    beforeSend: function (data) { // сoбытиe дo oтпрaвки

                    },
                    success: function (data) { // сoбытиe пoслe удaчнoгo oбрaщeния к сeрвeру и пoлучeния oтвeтa

                        // console.log(data);

                        if (data.needAuth) {
                            setTimeout(function () {
                                all_dialog_close_gl();
                                auth_popup.dialog('open');
                            }, 1);
                        } else if (data.redirectTo) {
                            setTimeout(function () {
                                window.location = data.redirectTo;
                            }, 1);
                        } else {
                            updateFav(data);
                        }

                    },
                    error: function (xhr, ajaxOptions, thrownError) { // в случae нeудaчнoгo зaвeршeния зaпрoсa к сeрвeру

                        console.log(xhr, ajaxOptions, thrownError);

                        // alert(xhr.status); // пoкaжeм oтвeт сeрвeрa
                        // alert(thrownError); // и тeкст oшибки
                    },
                    complete: function (data) { // сoбытиe пoслe любoгo исхoдa
                        favoriting = false;
                    }
                });
            }

            return false;

        })
        .delegate('.toggleOneClick', 'click', function () {

            $(this).closest('.prod_review_controls_w').find('.oneClickForm').toggle();

            return false;
        });

    qSearchForm.on('submit', function () {
        qSearchFunc();

        return false;
    });

    initMask();

    initValidation();

    addNoscrollStyle();

    initInputFillChecker();

    initCallbackPopup();

    initAuthPopup();

    initRecoveryPopup();

    initFailPopup();

    initSuccessPopup();

    initAddToCartPopup();

    initQuickSearchPopup();

    initTabs();

    initAsideSubmenu();

    initSelect2();

    initQSearch();

    all_dialog_close();

});

$(window).resize(function () {
    // console.log($(window).width());
    //
    // if ($(window).width() < 670) {
    //     $('.mCSBaside').mCustomScrollbar('destroy');
    // } else {
    //     $('.mCSBaside').mCustomScrollbar({
    //         documentTouchScroll: true,
    //         theme: "dark",
    //         scrollEasing: "linear"
    //     });
    // }

});

function animateOnce(el, addClass, removeClass) {
    el.addClass(addClass + ' animated').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function () {
        $(this).removeClass(addClass + ' ' + removeClass);
    });
}

function initQSearch() {
    $('.qSearchInput').on('keyup keydown change paste cut', function () {
        var search = $(this).val();

        clearTimeout(search_delay);

        if (!search.length) {
            searchResults.html('');
            return;
        }

        search_delay = setTimeout(function () {

            if (!searching && search != last_search) {
                searching = true;
                last_search = search;
                qSearchForm.trigger('submit');
            }
        }, 1000);
    });
}

function qSearchFunc() {
    var data = qSearchForm.serialize(); // пoдгoтaвливaeм дaнныe

    console.log(data);

    $.ajax({ // инициaлизируeм ajax зaпрoс
        type: qSearchForm.attr('method'), // oтпрaвляeм в POST фoрмaтe, мoжнo GET
        url: qSearchForm.attr('action'), // путь дo oбрaбoтчикa, у нaс oн лeжит в тoй жe пaпкe
        dataType: 'json', // oтвeт ждeм в json фoрмaтe
        data: data, // дaнныe для oтпрaвки
        beforeSend: function (data) { // сoбытиe дo oтпрaвки

        },
        success: function (data) { // сoбытиe пoслe удaчнoгo oбрaщeния к сeрвeру и пoлучeния oтвeтa

            searchResults.html(data.items);

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
            searching = false;
        }
    });

}

function renderQSearchResult(data) {
    var items = '';

    $.each(data, function (index, item) {
        console.log(item);

        items +=
            '<li>' +
            '<div class="product_item">' +
            '<a href="product_' + item._id + '" class="product_img">' +
            '<img src="' + item.main_img + '">' +
            '<div class="product_hit">Хит продаж</div>' +
            '<div class="product_share_holder">' +
            '<div class="product_share">- 30%</div>' +
            '</div>' +
            '</a>' +
            '<h3 class="product_caption">' + item.name + '</h3>' +
            '<div class="product_price">' +
            (item.old_price ? '<span class="old_price">' + formatPrice(item.old_price) + '<span> грн.</span></span>' : '') +
            '<span class="new_price">' + formatPrice(item.price) + '<span> грн.</span></span>' +
            '</div>' +
            '</div>' +
            '</li>';

    });

    searchResults.html(items);
}

function colorRender(colors) {
    var ret = '', arr = colors.split(',');

    for (var i = 0; i < arr.length; i++) {
        var clr = (arr[i]).trim();

        if (/^#/.test(clr) && isHex(clr.replace('#', ''))) {
            ret += '<li><div class="prod_color" style="background:' + clr + ';"></div></li>';
        } else if (clr.length > 10) {
            ret += '<li><div class="prod_color"><img src="' + clr + '"></div></li>';
        }
    }

    return ret;
}

function plural(n, str1, str2, str5, num) {
    return (num ? n + ' ' : '') + ((((n % 10) == 1) && ((n % 100) != 11)) ? (str1) : (((((n % 10) >= 2) && ((n % 10) <= 4)) && (((n % 100) < 10) || ((n % 100) >= 20))) ? (str2) : (str5)));
}

function isHex(h) {
    return /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(h.trim());
}

function formatPrice(s) {
    return ('' + s).replace(/(?!^)(?=(\d{3})+(?=\.|$))/gm, ' ');
}

function addNoscrollStyle() {

    $('.mCSB').each(function (ind) {
        $(this).mCustomScrollbar({
            documentTouchScroll: true,
            theme: "dark",
            scrollEasing: "linear",
            mouseWheel: {preventDefault: true}
        });
    });

    $('.mCSBaside').mCustomScrollbar({
        documentTouchScroll: true,
        theme: "dark",
        scrollEasing: "linear",
        mouseWheel: {preventDefault: true}
    });

    /*    return;
    
        html.css('overflow-y', 'hidden');
    
        var testWidth = html.width();
    
        html.attr('style', null);
    
        var scrollW = testWidth - html.width();
    
        $('<style type="text/css">').html('.no_scroll body, .no_scroll .auth_menu, .no_scroll .aside_right { margin-right: ' + (scrollW) + 'px; }.no_scroll .q_search_results_holder { margin-right: ' + (-scrollW) + 'px; }').appendTo('head');*/
}

function initValidation() {
    $('.validateMe').each(function (ind) {
        var f = $(this);

        f.validationEngine({
            //binded                   : false,
            scroll: false,
            showPrompts: true,
            showArrow: false,
            addSuccessCssClassToField: 'success',
            addFailureCssClassToField: 'error',
            // parentFieldClass: '.form_cell',
            // parentFormClass: '.order_block',
            promptPosition: "centerRight",
            //doNotShowAllErrosOnSubmit: true,
            //focusFirstField          : false,
            autoHidePrompt: true,
            autoHideDelay: 3000,
            autoPositionUpdate: false,
            prettySelect: true,
            //useSuffix                : "_VE_field",
            addPromptClass: 'relative_mode one_msg',
            showOneMessage: false
        });
    });
}

function initMask() {

    $("input").each(function (i, el) {
        var inp = $(el), param = inputMaskEvents;

        if (inp.attr('data-inputmask-custom') != void 0) {
            inp.inputmask(JSON.parse('{' + inp.attr('data-inputmask-custom').replace(/'/g, '"') + '}'));
        }

        // if (inp.attr('data-inputmask-phone') != void 0) {
        //     inp.mask(inp.attr('data-inputmask-phone'), {placeholder: inp.attr('data-mask-placeholder')});
        // }

        // if (inp.attr('data-inputmask-regex') != void 0) {
        //     param.regex = inp.attr('data-inputmask-regex');
        //
        //     inp.inputmask('Regex', param);
        // }

        if (inp.attr('data-inputmask') != void 0) {
            inp.inputmask();
        }

        if (inp.attr('data-inputmask-email') != void 0) {
            param.regex = inp.attr('data-inputmask-email');
            param.placeholder = '_';

            inp.inputmask('Regex', param);
        }

        if (inp.attr('data-inputmask-regex') != void 0) {
            inp.inputmask('Regex', inputMaskEvents);
        }
    });
}

function initInputFillChecker() {
    $('input').on('change keyup blur', function () {
        var inp = $(this);

        if ('text' == inp[0].type && 'required' == inp.attr('required')) {
            inp.toggleClass('empty', inp.val() == 0);
        }
    });
}

function initQuickSearchPopup() {

    quick_search_popup = $('#quick_search_popup').dialog({
        autoOpen: false,
        modal: true,
        closeOnEscape: true,
        closeText: '',
        dialogClass: 'no_close_mod no_title dialog_fixed',
        //appendTo: '.wrapper',
        width: '100%',
        draggable: true,
        collision: "fit",
        position: {my: "top center", at: "top center", of: window},
        open: function (event, ui) {
            body.addClass('modal_opened overlay_v2');
            html.addClass('no_scroll');
        },
        close: function (event, ui) {
            body.removeClass('modal_opened overlay_v2');
            html.removeClass('no_scroll');
        }
    });

    $('.quickSearchBtn').on('click', function () {

        quick_search_popup.dialog('open');

        return false;
    });

}

function initAddToCartPopup() {

    add2cart_popup = $('#add2cart_popup')
        .on('mouseenter', function () {
            clearTimeout(cart_info_timeout);
        })
        .on('mouseleave', function () {
            cart_info_timeout = setTimeout(function () {
                add2cart_popup.dialog('close');
            }, 3000);
        })
        .dialog({
            autoOpen: false,
            modal: false,
            closeOnEscape: true,
            closeText: '',
            dialogClass: 'no_close_on_dt dialog_close_butt_mod_1 dialog_g_size_3 mob_dialog_fixed',
            //appendTo: '.wrapper',
            width: 430,
            draggable: true,
            collision: "fit",
            position: {
                my: "right-5 top+15",
                at: "right bottom",
                of: $('.cartLink')
            },
            open: function (event, ui) {
                //body.addClass('modal_opened overlay_v2');


                // html.addClass('no_scroll');
            },
            close: function (event, ui) {
                //body.removeClass('modal_opened overlay_v2');
                // html.removeClass('no_scroll');
            }
        });

    $('.addToCart').on('click', function () {

        add2cart_popup.dialog('open');

        cart_info_timeout = setTimeout(function () {
            add2cart_popup.dialog('close');
        }, 3000);

        return false;
    });

}

function initCallbackPopup() {

    callback_popup = $('#callback_popup').dialog({
        autoOpen: false,
        modal: true,
        closeOnEscape: true,
        closeText: '',
        dialogClass: 'no_close_mod dialog_g_size_1',
        //appendTo: '.wrapper',
        width: 300,
        draggable: true,
        collision: "fit",
        position: {my: "top center", at: "top center", of: window},
        open: function (event, ui) {
            body.addClass('modal_opened overlay_v2');
            html.addClass('no_scroll');
        },
        close: function (event, ui) {
            body.removeClass('modal_opened overlay_v2');
            html.removeClass('no_scroll');
        }
    });

    $('.callbackBtn').on('click', function () {

        callback_popup.dialog('open');

        return false;
    });

}

function initAuthPopup() {

    auth_popup = $('#auth_popup').dialog({
        autoOpen: false,
        modal: true,
        closeOnEscape: true,
        closeText: '',
        dialogClass: 'no_close_mod dialog_g_size_1',
        //appendTo: '.wrapper',
        width: 462,
        draggable: true,
        collision: "fit",
        position: {my: "top center", at: "top center", of: window},
        open: function (event, ui) {
            body.addClass('modal_opened overlay_v2');
            html.addClass('no_scroll');
        },
        close: function (event, ui) {
            body.removeClass('modal_opened overlay_v2');
            html.removeClass('no_scroll');
        }
    });

    $('.authBtn').on('click', function () {
        if ($(this).hasClass('user')) {
            $('.logoutForm').trigger('submit');
        } else {
            auth_popup.dialog('open');
        }

        return false;
    });

    $('.authForm, .regForm, .logoutForm, .userUpdate').on('submit', function () {
        var form = $(this);

        if (form.validationEngine('validate')) {
            sendForm($(this), function () {

            });
        }

        return false;
    });

}

function sendForm(form, cb) {
    var data = form.serialize(); // пoдгoтaвливaeм дaнныe

    data += '&pathname=' + window.location.pathname;

    // console.log(data);

    $.ajax({ // инициaлизируeм ajax зaпрoс
        type: form.attr('method'), // oтпрaвляeм в POST фoрмaтe, мoжнo GET
        url: form.attr('action'), // путь дo oбрaбoтчикa, у нaс oн лeжит в тoй жe пaпкe
        dataType: 'json', // oтвeт ждeм в json фoрмaтe
        data: data, // дaнныe для oтпрaвки
        beforeSend: function (data) { // сoбытиe дo oтпрaвки

        },
        success: function (data) { // сoбытиe пoслe удaчнoгo oбрaщeния к сeрвeру и пoлучeния oтвeтa
            // console.log(data);

            $('.auth_msg').remove();

            if (data.needAuth) {
                setTimeout(function () {
                    all_dialog_close_gl();
                    auth_popup.dialog('open');
                }, 1);
            } else if (data.redirectTo) {
                setTimeout(function () {
                    window.location = data.redirectTo;
                }, 1);
            } else if (data.user_created) {
                $('#auth_tab_1 .tab_content').prepend('<p class="auth_msg">Подтвердите e-mail ' + data.email + '</p>');
                $('#auth_email').val(data.email);
                $('a[href="#auth_tab_1"]').click();
            } else if (data.logout_done) {
                $('#user_lk').remove();
                $('.authBtn').removeClass('user');
            } else if (data.user_updated) {
                setTimeout(function () {
                    $('.successText').text('Данные сохранены.');
                    success_popup.dialog('open');
                }, 50);
            } else if (data.user_authenticated) {
                $('.auth_menu').prepend(data.user);
                $('.authBtn').addClass('user');
                auth_popup.dialog('close');
            } else if (data.login_failed) {
                $('#auth_tab_1 .tab_content').prepend('<p class="auth_msg">' + data.message[0] + '</p>');
                $('#auth_pass').val('');
            } else if (data.recovery_failed) {
                $('#auth_tab_1 .tab_content').prepend('<p class="auth_msg">E-mail' + data.message[0] + ' не зарегистрирован</p>');
            } else if (data.recovery_success) {
                $('.successText').text('Инструкции отправлены на e-mail ' + data.message[0]);

                success_popup.dialog('open');

            } else {
                $('#auth_tab_2 .tab_content').prepend('<p class="auth_msg">' + data.message[0] + '</p>');
            }

            setTimeout(function () {
                $('.auth_msg').remove();
            }, 3000);
        },
        error: function (xhr, ajaxOptions, thrownError) { // в случae нeудaчнoгo зaвeршeния зaпрoсa к сeрвeру

            console.log(xhr, ajaxOptions, thrownError);

            // alert(xhr.status); // пoкaжeм oтвeт сeрвeрa
            // alert(thrownError); // и тeкст oшибки
        },
        complete: function (data) { // сoбытиe пoслe любoгo исхoдa
            if (typeof cb === 'function') {
                cb(data);
            }
        }
    });
}

function initFailPopup() {

    fail_popup = $('#fail_popup').dialog({
        autoOpen: false,
        modal: true,
        closeOnEscape: true,
        closeText: '',
        dialogClass: 'no_close_mod dialog_g_size_1',
        //appendTo: '.wrapper',
        width: 462,
        draggable: true,
        collision: "fit",
        position: {my: "top center", at: "top center", of: window},
        open: function (event, ui) {
            body.addClass('modal_opened overlay_v2');
            html.addClass('no_scroll');
        },
        close: function (event, ui) {
            body.removeClass('modal_opened overlay_v2');
            html.removeClass('no_scroll');
        }
    });

    $('.openFailPopup').on('click', function () {

        fail_popup.dialog('open');

        return false;
    });

}

function initSuccessPopup() {

    success_popup = $('#success_popup').dialog({
        autoOpen: false,
        modal: true,
        closeOnEscape: true,
        closeText: '',
        dialogClass: 'no_close_mod dialog_g_size_1',
        //appendTo: '.wrapper',
        width: 462,
        draggable: true,
        collision: "fit",
        position: {my: "top center", at: "top center", of: window},
        open: function (event, ui) {
            body.addClass('modal_opened overlay_v2');
            html.addClass('no_scroll');
        },
        close: function (event, ui) {
            body.removeClass('modal_opened overlay_v2');
            html.removeClass('no_scroll');
        }
    });

    $('.openSuccessPopup').on('click', function () {

        success_popup.dialog('open');

        return false;
    });

}

function initRecoveryPopup() {

    recovery_popup = $('#recovery_popup').dialog({
        autoOpen: false,
        modal: true,
        closeOnEscape: true,
        closeText: '',
        dialogClass: 'no_close_mod dialog_g_size_1',
        //appendTo: '.wrapper',
        width: 462,
        draggable: true,
        collision: "fit",
        position: {my: "top center", at: "top center", of: window},
        open: function (event, ui) {
            body.addClass('modal_opened overlay_v2');
            html.addClass('no_scroll');
        },
        close: function (event, ui) {
            body.removeClass('modal_opened overlay_v2');
            html.removeClass('no_scroll');
        }
    });

    $('.passRecoveryBtn').on('click', function () {
        auth_popup.dialog('close');

        recovery_popup.dialog('open');

        return false;
    });

}

function initAsideSubmenu() {

    $('body')
        .delegate('.menuItem', 'mouseenter ', function (e) {
            $(this).addClass('hovered just_hovered');
        })
        .delegate('.menuItem', 'mouseleave', function (e) {
            $(this).removeClass('hovered just_hovered');
        })
        .delegate('.menuItem', 'click', function (e) {

            var el = $(this);

            if (el.hasClass('just_hovered')) {
                el.removeClass('just_hovered');
            } else {
                el.toggleClass('hovered');
            }
        });

}

function initTabs() {

    $('.tabBlock').each(function (ind) {
        var tab = $(this);

        tab.tabs({
            active: 0,
            tabContext: tab.attr('data-tab-context'),
            activate: function (e, u) {
                $('.tabActive').prop('checked', null);
                $(u.newPanel).find('.tabActive').click();
            }
        });
    });
}

function initSelect2() {

    $('.select2').each(function (ind) {
        var slct = $(this);

        slct.select2({
            minimumResultsForSearch: Infinity,
            dropdownParent: slct.parent(),
            width: '100%'
        });
    });
}

function updateFav(data) {
    var favBtn = $('.favBtn').removeClass('favorite');

    animateOnce($('.favCounter').text(data.items.length), 'bounceIn');

    $('.favUnitMarker').parent().html(data.items_html);

    $('.favContainer').toggleClass('_empty', !data.items.length);

    for (var i = 0; i < data.items.length; i++) {
        $('.favBtn[data-id="' + data.items[i] + '"]').addClass('favorite')
    }

}

function all_dialog_close() {
    body.on('click', '.ui-widget-overlay, .popupClose', all_dialog_close_gl);
}

function all_dialog_close_gl() {
    $(".ui-dialog-content").each(function () {
        var $this = $(this);
        if (!$this.parent().hasClass('always_open')) {
            $this.dialog("close");
        }
    });
}