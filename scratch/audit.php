<?php
define('WP_USE_THEMES', false);
require_once('../../../../wp-load.php');

$categories = get_terms([
    'taxonomy' => 'product_cat',
    'hide_empty' => false,
]);

$cats_data = [];
foreach ($categories as $cat) {
    $cats_data[] = [
        'term_id' => $cat->term_id,
        'name' => $cat->name,
        'slug' => $cat->slug,
        'count' => $cat->count
    ];
}

$products_data = [];
$args = array(
    'post_type'      => 'product',
    'posts_per_page' => -1,
    'post_status'    => 'any',
);
$query = new WP_Query($args);

if ($query->have_posts()) {
    while ($query->have_posts()) {
        $query->the_post();
        global $product;
        
        $cats = wp_get_post_terms(get_the_ID(), 'product_cat', ['fields' => 'names']);
        $cat_ids = wp_get_post_terms(get_the_ID(), 'product_cat', ['fields' => 'ids']);

        $products_data[] = [
            'id' => get_the_ID(),
            'title' => get_the_title(),
            'status' => get_post_status(),
            'categories' => $cats,
            'category_ids' => $cat_ids,
            'price' => $product ? $product->get_price() : '',
            'stock_status' => $product ? $product->get_stock_status() : ''
        ];
    }
    wp_reset_postdata();
}

$response = [
    'categories' => $cats_data,
    'products' => $products_data
];

file_put_contents('audit_output_utf8.json', json_encode($response, JSON_PRETTY_PRINT));
echo "OK";
