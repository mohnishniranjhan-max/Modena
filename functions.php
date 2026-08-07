<?php
function load_react_app_assets() {
    $theme_dir = get_template_directory();
    $theme_uri = get_template_directory_uri();

    // Check dist/assets (Vite build folder) first, then fallback to assets/assets or assets
    $assets_dir = '';
    $assets_uri = '';

    if (is_dir($theme_dir . '/dist/assets')) {
        $assets_dir = $theme_dir . '/dist/assets';
        $assets_uri = $theme_uri . '/dist/assets';
    } elseif (is_dir($theme_dir . '/assets/assets')) {
        $assets_dir = $theme_dir . '/assets/assets';
        $assets_uri = $theme_uri . '/assets/assets';
    } elseif (is_dir($theme_dir . '/assets')) {
        $assets_dir = $theme_dir . '/assets';
        $assets_uri = $theme_uri . '/assets';
    }

    if ($assets_dir && is_dir($assets_dir)) {
        $files = scandir($assets_dir);
        $css_index = 0;
        $js_index = 0;

        foreach ($files as $file) {
            if ($file === '.' || $file === '..') {
                continue;
            }

            $ext = pathinfo($file, PATHINFO_EXTENSION);
            $filepath = $assets_dir . '/' . $file;
            $fileurl  = $assets_uri . '/' . $file;
            $ver      = filemtime($filepath);

            if ($ext === 'css') {
                $handle = ($css_index === 0) ? 'react-theme-css' : 'react-theme-css-' . $css_index;
                wp_enqueue_style($handle, $fileurl, array(), $ver, 'all');
                $css_index++;
            } elseif ($ext === 'js') {
                $handle = ($js_index === 0) ? 'react-theme-js' : 'react-theme-js-' . $js_index;
                wp_enqueue_script($handle, $fileurl, array(), $ver, true);
                $js_index++;
            }
        }
    }
}
add_action('wp_enqueue_scripts', 'load_react_app_assets');

// Add type="module" to React theme scripts for Vite ES module support
function add_module_type_attribute($tag, $handle, $src) {
    if (strpos($handle, 'react-theme-js') !== false) {
        $tag = '<script type="module" src="' . esc_url($src) . '"></script>';
    }
    return $tag;
}
add_filter('script_loader_tag', 'add_module_type_attribute', 10, 3);

// Polyfill window.crypto.randomUUID for non-secure HTTP contexts (IP connections)
function polyfill_crypto_random_uuid() {
    ?>
    <script id="crypto-random-uuid-polyfill">
    if (typeof window !== 'undefined') {
        if (!window.crypto) {
            window.crypto = {};
        }
        if (!window.crypto.randomUUID) {
            window.crypto.randomUUID = function randomUUID() {
                return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, function (c) {
                    return (c ^ (window.crypto && window.crypto.getRandomValues ? window.crypto.getRandomValues(new Uint8Array(1))[0] : Math.floor(Math.random() * 16)) & (15 >> (c / 4))).toString(16);
                });
            };
        }
    }
    </script>
    <?php
}
add_action('wp_head', 'polyfill_crypto_random_uuid', 0);

// Automatically create Prime Categories and Sub-Categories in WordPress
function seed_modena_woocommerce_categories() {
    $taxonomies = array('category');
    if (taxonomy_exists('product_cat')) {
        $taxonomies[] = 'product_cat';
    }

    $hierarchy = array(
        array(
            'name' => 'Bestseller',
            'slug' => 'bestseller',
            'description' => 'Top Rated Customer Favorites & Flagship Machinery',
            'children' => array(
                array('name' => 'Top Rated Appliances', 'slug' => 'top-appliances'),
                array('name' => 'Flagship Cookware', 'slug' => 'flagship-cookware')
            )
        ),
        array(
            'name' => 'Deal',
            'slug' => 'deal',
            'description' => 'Limited-Time Flash Sales & Special Discounts',
            'children' => array(
                array('name' => 'Flash Sale Mixers', 'slug' => 'flash-mixers'),
                array('name' => 'Clearance Offers', 'slug' => 'clearance-offers')
            )
        ),
        array(
            'name' => 'Electronics',
            'slug' => 'electronics',
            'description' => 'Heavy Duty 990W Motor Mixers, Air Fryers & Electric Machinery',
            'children' => array(
                array('name' => 'Mixer Grinders', 'slug' => 'mixer-grinders'),
                array('name' => 'Air Fryers', 'slug' => 'air-fryers'),
                array('name' => 'Blenders & Choppers', 'slug' => 'blenders-choppers'),
                array('name' => 'Induction Cooktops', 'slug' => 'induction-cooktops')
            )
        ),
        array(
            'name' => 'Utensils',
            'slug' => 'utensils',
            'description' => 'Heritage Cookware, Cast Iron Skillets & German Steel Knives',
            'children' => array(
                array('name' => 'Cast Iron Cookware', 'slug' => 'cast-iron-cookware'),
                array('name' => 'Tri-Ply Stainless Steel', 'slug' => 'stainless-steel'),
                array('name' => 'Dutch Ovens & Stew Pots', 'slug' => 'dutch-ovens'),
                array('name' => 'German Knives & Cutlery', 'slug' => 'knives-cutlery')
            )
        )
    );

    foreach ($taxonomies as $tax) {
        foreach ($hierarchy as $parent_cat) {
            $parent_term = term_exists($parent_cat['slug'], $tax);
            if (!$parent_term) {
                $parent_term = wp_insert_term(
                    $parent_cat['name'],
                    $tax,
                    array(
                        'slug'        => $parent_cat['slug'],
                        'description' => $parent_cat['description']
                    )
                );
            }

            $parent_id = is_array($parent_term) ? $parent_term['term_id'] : (is_object($parent_term) ? (isset($parent_term->term_id) ? $parent_term->term_id : 0) : 0);

            if ($parent_id && !empty($parent_cat['children'])) {
                foreach ($parent_cat['children'] as $child) {
                    if (!term_exists($child['slug'], $tax)) {
                        wp_insert_term(
                            $child['name'],
                            $tax,
                            array(
                                'slug'   => $child['slug'],
                                'parent' => $parent_id
                            )
                        );
                    }
                }
            }
        }
    }
}
add_action('init', 'seed_modena_woocommerce_categories', 99);
?>
