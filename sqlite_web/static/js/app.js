App = window.App || {};

(function(exports, $) {
    initialize = function() {
        const textareas = document.querySelectorAll('textarea.remember-size');
        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                const id = entry.target.id;
                const textarea = $(entry.target);
                const newHeight = entry.contentRect.height;
                localStorage.setItem('textarea-' + id + '-height', newHeight);
            }
        });

        textareas.forEach(textarea => {
            if (textarea.id) {
                var height = localStorage.getItem('textarea-' + textarea.id + '-height');
                if (height) {
                    $(textarea).height(height);
                }
                resizeObserver.observe(textarea);
            }
        });

        /* Toggle long values on/off. */
        $('a.toggle-value').on('click', function(e) {
            e.preventDefault();
            var elem = $(this),
                truncated = elem.siblings('span.truncated'),
                full = elem.siblings('span.full');
            truncated.toggle();
            full.toggle();
        });

        /* Show/hide table info div. */
        var tableInfo = $('div#tableInfo');
        if (tableInfo.length > 0) {
            if (localStorage.getItem('tableInfo') === 'false') {
                tableInfo.hide();
            }

            $('a#toggleTableInfo').on('click', function(e) {
                e.preventDefault();
                var show = !tableInfo.is(':visible');
                localStorage.setItem('tableInfo', show ? 'true' : 'false')
                tableInfo.toggle();
            });
        }

        /* Show SQL (e.g. for indexes / triggers). */
        $('a.view-sql').on('click', function(e) {
            e.preventDefault();
            var elem = $(this),
                pre = elem.siblings('div'),
                modalDiv = $('div#sql-modal');
            modalDiv.find('h5.modal-title').text(elem.data('name'));
            modalDiv.find('.modal-body').empty().append(pre.clone().show());
            modalDiv.modal({'keyboard': true});
        });

        /* Show one of the SQL syntax railroad diagrams. */
        $('a.sql-image').on('click', function(e) {
            e.preventDefault();
            var elem = $(this),
                imgUrl = elem.attr('href'),
                modalDiv = $('div#sql-image-modal');
            modalDiv.find('h5.modal-title').text(elem.text());
            modalDiv.find('.modal-body').empty().append(
                $('<img src="' + imgUrl + '" style="max-width:100%;" />'));
            modalDiv.modal({'keyboard': true});
        });

        /* Toggle helper virtual tables and table typeahead search. */
        $('a#toggle-helper-tables').on('click', function(e) {
            e.preventDefault();
            $('ul#helper-tables').toggle();
        });
        $('input#table-search').on('keyup', function(e) {
            var searchQuery = $(this).val().toUpperCase();
            $('li.table-link').each(function() {
                var elem = $(this),
                    tableName = elem.find('a').prop('innerText').toUpperCase();
                elem.toggle(tableName.indexOf(searchQuery) != -1);
            });
        });

        /* Checkboxes for enabling/disabling inputs. */
        $('input.chk-enable-column').on('click', function (evt) {
            var elem = $(this),
                inp = $('#' + elem.data('target-element'));
            inp.prop('disabled', elem.is(':checked') ? false : true);
        });

        $('input#toggle-checkboxes').on('click', function (evt) {
            $('input.chk-enable-column').prop('checked', $(this).is(':checked'));
            $('input.chk-enable-column').each(function(_) {
                var elem = $(this),
                    inp = $('#' + elem.data('target-element'));
                inp.prop('disabled', elem.is(':checked') ? false : true);
            });
        });

        $('input#toggle-pk-all').on('click', function (evt) {
            $('input.toggle-pk').prop('checked', $(this).is(':checked'));
            $('button.bulk-action').prop('disabled', ($('input.toggle-pk:checked').length == 0));
        });
        $('input.toggle-pk').on('click', function (evt) {
            $('button.bulk-action').prop('disabled', ($('input.toggle-pk:checked').length == 0));
        });

        /* Initialize focus on SQL textarea. */
        var sqlTextarea = $('textarea[name="sql"]');
        if (sqlTextarea.length > 0) {
            sqlTextarea.focus();
        }

        /* Initialize SQL history dropdown on all pages. */
        var historyDropdown = $('#sql-history-dropdown');
        if (historyDropdown.length > 0) {
            var recent = new App.Recent();
            recent.initialize();
        }

        /* Initialize settings modal. */
        var settingsModal = $('#settingsModal');
        if (settingsModal.length > 0) {
            var settings = new App.Settings();
            settings.initialize();
        }

        /* Initialize AI chat modal. */
        var aiChatModal = $('#aiChatModal');
        if (aiChatModal.length > 0) {
            var aiChat = new App.AIChat();
            aiChat.initialize();
        }
    };

    exports.initialize = initialize;
})(App, jQuery);
