<?php
define('WP_USE_THEMES', false);
require_once('../../../../wp-load.php');

$categories_to_keep = [15, 107, 124, 125, 126];

$all_categories = get_terms([
    'taxonomy' => 'product_cat',
    'hide_empty' => false,
]);

$deleted_count = 0;
foreach ($all_categories as $cat) {
    if (!in_array($cat->term_id, $categories_to_keep)) {
        wp_delete_term($cat->term_id, 'product_cat');
        $deleted_count++;
    }
}

echo "Deleted $deleted_count duplicate/unused categories.";
