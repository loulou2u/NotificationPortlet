//
//  Notifications portlet jQuery plugin
//  developed on behalf of the University 
//  of Manchester
//
//  Author: Jacob Lichner
//  Email: jlichner@unicon.net
//
(function ($) {

  // Set underscore's templating syntax
  _.templateSettings = {
    interpolate : /\{\{(.+?)\}\}/g, // {{ variable }}
    evaluate    : /\{%(.+?)%\}/g    // {% expression %}
  };
  
  $.fn.notifications = function (opts) {
    
    // Store URL
    var url = opts.url;

    // Cache existing DOM elements  
    var portlet         = this.find(".notification-portlet-wrapper"),
        links           = this.find(".notification-portlet-wrapper a"),
        errorContainer  = this.find(".notification-error-container"),
        loading         = this.find(".notification-loading"),
        notifications   = this.find(".notification-container"),
        detailView      = this.find(".notification-detail-wrapper"),
        detailContainer = this.find(".notification-detail-container"),
        backButton      = this.find(".notification-back-button a"),
        refreshButton   = this.find(".notification-refresh a")
        
    // Notification gets cached in the AJAX callback
    // but is created here for scope
    var notification;
    
    function init() {

      // Looading div is displayed by default
      // and is then hidden after the AJAX call   
      loading.ajaxStop(function () {
        $(this).hide();
        portlet.fadeIn("fast");
      });

      // Ajax call to get notification JSON
      $.getJSON(url, function(data) {

        // Build notifications
        buildNotifications(data);

        // Once notifications have been injected into the DOM
        // we cache the notication element...
        notification = $(".notifications a");

        // ...and bind our events
        bindEvent.accordion();
        bindEvent.viewDetail();
        bindEvent.goBack();
        bindEvent.refresh();
        
        // errors
        errorHandling(data);
      });

      // TODO: Better error message when AJAX fails
      portlet.ajaxError(function () {
        $(this).html(" ").text("AJAX failed.");
      });
    }

    // Build notifications using underscore.js
    // template method
    function buildNotifications(data) {

      // HTML string parsed with underscore.js
      var html = '\
        {% _.each(categories, function(category) { %} \
          <div class="notification-trigger"> \
            <h3 class="portlet-section-header trigger-symbol" role="header"> \
              {{ category.title }} ({{ category.entries.length }}) \
            </h3> \
          </div> \
          {% if (category.entries.length < 1) { %} \
            <!-- no notifications! --> \
          {% } else { %} \
            <div class="notification-content" style="display: none;"> \
              <ul class="notifications"> \
                {% _.each(category.entries, function(entry) { %} \
                  <li> \
                    <a href="{{ entry.link }}" \
                    data-body="{{ entry.body }}" \
                    data-title="{{ entry.title }}" \
                    data-source="{{ category.source.title }}">{{ entry.title }}</a> \
                  </li> \
                {% }); %} \
              </ul> \
            </div> \
          {% } %} \
        {% }); %} \
      ';

      // Inject compiled markup into notifications container div
      var compiled = _.template(html, data);
      notifications.prepend(compiled);
    }

    // Bind events object helps keep event functions together 
    var bindEvent = {

      // Accordion effect via plugin
      accordion: function () {
        notifications.accordion();
      },

      // View detail page
      viewDetail: function () {
        notification.click(function () {

          // Notification detail is retrieved from 'data-' attributes
          // and stored in a notification object
          var notification = {
            body   : $(this).data("body"),
            title  : $(this).data("title"),
            source : $(this).data("source"),
            link   : $(this).attr("href")
          }

          var html = '\
            <h3><a href="{{ link }}">{{ title }}</a></h3> \
            <p>{{ body }}</p> \
            <p class="notification-source"> \
              Source: <a href="{{ link }}">{{ source }}</a> \
            </p> \
          ';

          var compiled = _.template(html, notification);

          notifications.hide(
            "slide", 200, function () {
              detailContainer.html(" ").append(compiled);
              detailView.show();
            }
          );

          return false;
        });
      },

      // Go back to all notifications
      goBack: function () {
        backButton.click(function () {
          detailView.hide(
            "slide", {direction: "right"}, 200, function () {
              notifications.show();
            }
          );

          return false;
        });
      },

      // Refresh notifications
      refresh: function () {
        refreshButton.click(function () {

          // Hide detail view
          if ( detailView.is(":visible") ) {
            detailView.hide();
            notifications.show();
          }

          // Show loading
          portlet.hide();
          loading.show();

          // Unbind click events
          links.unbind("click");

          // Clear out notifications and errors
          notifications.html(" ");
          errorContainer.html(" ");

          // Refresh
          init();

          return false;
        });
      }
    }
    
    // Broken feeds
    function errorHandling(data) {
      if ( data.errors ) {
        var html = '\
          {% _.each(errors, function(error) { %} \
            <div class="portlet-msg-error"> \
              {{ error.source.title }}: {{ error.error }} \
              <a href="#" class="remove" title="Hide"></a> \
            </div> \
          {% }); %} \
        ';
        var compile = _.template(html, data);
        
        errorContainer.show().append(compile);
        errorContainer.find(".remove").click(function () {
          $(this).parent().fadeOut("fast");
          return false;
        });
      }
    }
        
    init();
  }
  
})(jQuery);