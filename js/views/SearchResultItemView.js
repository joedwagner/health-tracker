// View for individual search result
var SearchResultItemView = Backbone.View.extend({

    tagName: 'li',
    className: 'search-result-item',
    template: _.template($('#search-result-item-template').html()),

    initialize: function (options) {
        this.eventList = options.eventList;
    },

    render: function () {
        this.$el.html(this.template(this.model.attributes));
        return this;
    },

    events: {
        'click .add': 'trackItem'
    },

    trackItem: function (event) {
        this.eventList.trigger('addItem', this);
    }

});