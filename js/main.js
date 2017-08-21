$(function() {

    // Init the app
    var eventList = _.extend({}, Backbone.Events);
    var trackedItemListView = new TrackedItemListView({eventList: eventList});
    var searchResultListView = new SearchResultsView({eventList: eventList});

    var searchBox = $('#search-box');

    $('#search-form').submit(function (event) {

        searchResultListView.makeSearchRequest(searchBox.val());

        event.preventDefault();
    });
});