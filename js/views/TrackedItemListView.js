// Container for tracked items
var TrackedItemListView = Backbone.View.extend({

    tagName: 'section',
    id: 'tracked-items',
    template: _.template($('#tracked-item-list-template').html()),
    totalTemplate: _.template($('#total-calories-template').html()),

    render: function () {
        this.$el.html(this.template(this));

        return this;
    },

    initialize: function (options) {

        var self = this;

        this.collection = new NutritionItemCollection();

        $('#app').append(this.render().el);

        this.listenTo(this.collection, 'add', this.updateDB);
        this.listenTo(this.collection, 'remove', this.updateDB);

        // Listen to the shared pub/sub eventList
        this.eventList = options.eventList;
        _.bindAll(this, 'addItem', 'removeItem');
        this.eventList.bind('addItem', this.addItem);
        this.eventList.bind('removeItem', this.removeItem);

        var savedItems = localStorage.getItem('tracked-items');

        if (savedItems != null) {
            var items = JSON.parse(savedItems);
            items.forEach(function (savedItem) {
                var item = new NutritionItem(savedItem);
                self.addItem(new TrackedItemView({model: item}, {eventList: this.eventList}));
            });
        }

    },

    updateDB: function () {
        if (this.collection.length > 0) {
            localStorage.setItem('tracked-items', JSON.stringify(this.collection));
        } else {
            localStorage.clear();
        }
    },

    addItem: function (item) {

        this.eventList.trigger('clearSearchResults');

        this.collection.add(item.model);

        if (this.collection.length === 1) {
            $('#app').append(this.render().el);
        }

        var trackedItemView = new TrackedItemView({model: item.model, eventList: this.eventList});

        $('.total').remove();

        this.$el.find('#tracked-item-list').append(this.totalTemplate(this));

        $(trackedItemView.render().el).insertBefore('.total');

    },

    removeItem: function (item) {

        this.collection.remove(item.model);

        $('.total').remove();
        item.$el.remove();

        if (this.collection.length === 0) {
            $('#app').append(this.render().el);

        } else {
            this.$el.find('#tracked-item-list').append(this.totalTemplate(this));
        }

    },

    sumCalories: function () {

        var sum = 0;
        this.collection.each(function (item) {
            sum += item.get('calories');
        });

        return sum.toFixed(2);

    }

});