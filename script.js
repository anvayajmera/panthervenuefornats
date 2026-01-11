$(document).ready(function() {
    $('.as-slider').each(function() {
        var $this = $(this);
        var bgs = JSON.parse($this.attr('data-settings')).background_slideshow_gallery;
        var bgHTML = '<div class="as-slider-background">';
        if (bgs) {
            bgs.forEach(function(background) {
                bgHTML += `<img src="${background.url}"/>`;
            });
        }
        bgHTML += '</div>';
        $this.prepend(bgHTML);
        // Additional slider functionality can be added here
    });
});



