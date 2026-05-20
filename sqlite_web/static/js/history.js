App = window.App || {};

(function(exports, $) {
    function escapeHtml(text) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(text));
        return div.innerHTML;
    }

    Recent = function() {};

    Recent.prototype.initialize = function() {
        this.sqlTextarea = $('textarea[name="sql"]');
        this.form = this.sqlTextarea.length ? this.sqlTextarea.parents('form') : null;
        this.entries = [];
        this.bindHandlers();
        this.fetchHistory();
    };

    Recent.prototype.fetchHistory = function() {
        var self = this;
        $.getJSON('/history/recent/', function(data) {
            self.entries = data;
            self.populateHistoryDropdown();
        });
    };

    Recent.prototype.populateHistoryDropdown = function() {
        var self = this;
        var container = $('#sql-history-dropdown');
        container.empty();
        if (!container.length) return;

        if (this.entries.length === 0) {
            container.append('<div class="dropdown-item text-muted">No recent queries</div>');
            return;
        }

        for (var i = 0; i < this.entries.length; i++) {
            var entry = this.entries[i];
            var resultInfo = entry.result_count != null ? ' (' + entry.result_count + ' rows)' : '';
            var displaySql = entry.sql.length > 80 ? entry.sql.substring(0, 80) + '...' : entry.sql;
            var escapedSql = escapeHtml(displaySql);
            var tsDisplay = entry.timestamp ? ' \u2014 ' + entry.timestamp.substring(0, 16) : '';

            var elem = $(
                '<div class="dropdown-item sql-history-item" data-index="' + i + '">' +
                '<div class="sql-history-text">' + escapedSql + '</div>' +
                '<small class="sql-history-meta">' + tsDisplay + resultInfo + '</small>' +
                '</div>'
            );

            elem.on('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                var idx = $(this).data('index');
                if (self.sqlTextarea.length) {
                    self.sqlTextarea.val(self.entries[idx].sql);
                    self.sqlTextarea.focus();
                    $('#sql-history-dropdown').dropdown('toggle');
                } else {
                    window.location.href = '/query/?sql=' + encodeURIComponent(self.entries[idx].sql);
                }
            });

            container.append(elem);
        }
    };

    Recent.prototype.bindHandlers = function() {
        var self = this;
        if (this.sqlTextarea.length) {
            this.sqlTextarea.on('keydown', function(e) {
                if ((e.metaKey || e.ctrlKey) && e.keyCode == 13) { // ctrl+enter or meta+enter.
                    self.form.submit();
                }
            });
        }
    };

    exports.Recent = Recent;
})(App, jQuery);
