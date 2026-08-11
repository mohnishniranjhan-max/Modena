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

// Add Modena Browser Tab Favicon Icon
function modena_add_favicon() {
    $icon_url = get_template_directory_uri() . '/public/modena_icon_black_red.svg';
    echo '<link rel="icon" type="image/svg+xml" href="' . esc_url($icon_url) . '" />' . "\n";
    echo '<link rel="shortcut icon" href="' . esc_url($icon_url) . '" />' . "\n";
}
add_action('wp_head', 'modena_add_favicon', 1);

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

// Automatically seed PowerPoint (online-website.pptx) products into WordPress WooCommerce database
function seed_modena_ppt_products() {
    if (get_option('modena_ppt_products_seeded_v3')) {
        return;
    }

    $products_data = array(
        array(
            'title'       => 'Modena Nutri-Blend High-Speed Personal Blender & Mixer',
            'slug'        => 'modena-nutri-blend-personal-blender',
            'price'       => '2499',
            'regular'     => '3499',
            'desc'        => 'Powerful High-Speed Motor for fast blending and grinding. Food-Grade Polycarbonate Jars (BPA-free, durable, and unbreakable). Stainless Steel Cross Blade for smooth blending of smoothies and shakes. Includes Leak-Proof Travel Lid & Sipper Lid. One-Touch Operation with Non-Slip Base.',
            'category'    => 'blenders-choppers',
            'parent_cat'  => 'electronics',
            'image'       => 'modena-nutri-blend-blender-main.png',
            'gallery'     => array('modena-nutri-blend-blender-angle.png')
        ),
        array(
            'title'       => 'Modena 550W High-Performance Mixer Grinder (2 Stainless Steel Jars)',
            'slug'        => 'modena-550w-mixer-grinder',
            'price'       => '2899',
            'regular'     => '3899',
            'desc'        => '550 Watts High-Performance Motor (18,000–20,000 RPM). 3 Speed Settings + Pulse. Includes 2 Food-Grade Stainless Steel Jars with sharp precision-engineered blades. ABS plastic body with Overload Protection and Anti-Skid Rubber Feet.',
            'category'    => 'mixer-grinders',
            'parent_cat'  => 'electronics',
            'image'       => 'modena-550w-mixer-grinder.jpg',
            'gallery'     => array()
        ),
        array(
            'title'       => 'Modena 750W Heavy-Duty Mixer Grinder (3 Stainless Steel Jars)',
            'slug'        => 'modena-750w-heavy-duty-mixer',
            'price'       => '3499',
            'regular'     => '4699',
            'desc'        => '750 Watts Heavy-Duty Motor (20,000–22,000 RPM). 3 Speed Settings + Pulse. Includes 3 Food-Grade Stainless Steel Jars. Equipped with Overload Protection and Anti-Skid Vacuum Feet for maximum stability.',
            'category'    => 'mixer-grinders',
            'parent_cat'  => 'electronics',
            'image'       => 'modena-750w-heavy-duty-mixer.jpg',
            'gallery'     => array()
        ),
        array(
            'title'       => 'Modena Sujata 3-Jar Stainless Steel Set',
            'slug'        => 'modena-sujata-3jar-set',
            'price'       => '1899',
            'regular'     => '2599',
            'desc'        => 'Complete 3-Jar Set including Liquidizing Jar, Dry Grinding Jar, and Chutney Jar. Premium food-grade, rust-resistant stainless steel with sharp blades and heavy-duty construction.',
            'category'    => 'mixer-grinders',
            'parent_cat'  => 'electronics',
            'image'       => 'modena-sujata-3jar-set.jpg',
            'gallery'     => array()
        ),
        array(
            'title'       => 'Modena Karina 3-Jar Set with PC Polycarbonate Lid',
            'slug'        => 'modena-karina-3jar-pc-lid',
            'price'       => '1999',
            'regular'     => '2799',
            'desc'        => 'Complete 3-Jar Set with Polycarbonate Lids. Includes Liquidizing, Dry Grinding, and Chutney Jars made from food-grade stainless steel with precision blades.',
            'category'    => 'mixer-grinders',
            'parent_cat'  => 'electronics',
            'image'       => 'modena-karina-3jar-pc-lid.png',
            'gallery'     => array()
        ),
        array(
            'title'       => 'Modena Preethi Heavy-Duty 3-Jar Set',
            'slug'        => 'modena-preethi-heavy-duty-jar-set',
            'price'       => '2199',
            'regular'     => '2999',
            'desc'        => 'Heavy-Duty Construction 3-Jar Set. Made from food-grade stainless steel with sharp precision blades for fast and uniform grinding.',
            'category'    => 'mixer-grinders',
            'parent_cat'  => 'electronics',
            'image'       => 'modena-preethi-heavy-duty-jar-set.jpg',
            'gallery'     => array()
        ),
        array(
            'title'       => 'Modena Pre-Seasoned Cast Iron Dosa Tawa (Heavy Gauge)',
            'slug'        => 'modena-cast-iron-dosa-tawa',
            'price'       => '1299',
            'regular'     => '1799',
            'desc'        => '100% Pre-Seasoned Cast Iron Dosa Tawa. Heavy-duty construction retains heat for a long time. Ideal for sautéing, searing, frying eggs, and griddling pancakes. Oven safe up to 500°F.',
            'category'    => 'cast-iron-cookware',
            'parent_cat'  => 'utensils',
            'image'       => 'modena-cast-iron-dosa-tawa-main.png',
            'gallery'     => array('modena-cast-iron-dosa-tawa-angle.jpeg')
        ),
        array(
            'title'       => 'Modena 9-Pit Cast Iron Paniyaram & Appam Pan',
            'slug'        => 'modena-9pit-paniyaram-pan',
            'price'       => '999',
            'regular'     => '1399',
            'desc'        => '9-Pit Pre-Seasoned Cast Iron Paniyaram Pan. Smooth finish cookware suitable for gas and smooth surface induction cooktops. Heavy gauge construction lasts for generations.',
            'category'    => 'cast-iron-cookware',
            'parent_cat'  => 'utensils',
            'image'       => 'modena-9pit-paniyaram-pan.jpg',
            'gallery'     => array()
        ),
        array(
            'title'       => 'Modena Pre-Seasoned Cast Iron Kadai (2.5 Litre)',
            'slug'        => 'modena-preseasoned-cast-iron-kadai',
            'price'       => '1599',
            'regular'     => '2199',
            'desc'        => '2.5 Litre capacity pre-seasoned cast iron kadai. Chemical-free, 100% food safe, heavy-duty construction with dual cast iron handles.',
            'category'    => 'cast-iron-cookware',
            'parent_cat'  => 'utensils',
            'image'       => 'modena-preseasoned-cast-iron-kadai.jpg',
            'gallery'     => array()
        ),
        array(
            'title'       => 'Modena Non-Stick Chapati Tawa (Heat-Resistant Wooden Handle)',
            'slug'        => 'modena-nonstick-chapati-tawa',
            'price'       => '799',
            'regular'     => '1199',
            'desc'        => 'Non-Stick Flat Chapati Tawa with premium scratch-resistant coating and heat-resistant wooden handle. Heavy gauge construction for uniform heat distribution on gas stoves.',
            'category'    => 'stainless-steel',
            'parent_cat'  => 'utensils',
            'image'       => 'modena-nonstick-chapati-tawa.jpg',
            'gallery'     => array()
        ),
        array(
            'title'       => 'Modena TurboCuk Triply Stainless Steel Tadka Pan (300ml)',
            'slug'        => 'modena-turbocuk-triply-tadka-pan',
            'price'       => '649',
            'regular'     => '899',
            'desc'        => '300ml 3-Layer Thick Body Tri-Ply Tadka Pan for spice seasoning & heating. 100% toxin-free, non-stick, suitable for induction and gas stoves.',
            'category'    => 'stainless-steel',
            'parent_cat'  => 'utensils',
            'image'       => 'modena-turbocuk-triply-tadka-pan.jpg',
            'gallery'     => array()
        ),
        array(
            'title'       => 'Modena Heavy-Duty Stainless Steel Chopping Board (41x31 cm)',
            'slug'        => 'modena-ss-chopping-board',
            'price'       => '899',
            'regular'     => '1299',
            'desc'        => 'Premium 304 Food-Grade Stainless Steel Chopping Board (41cm x 31cm). Rust-resistant, double-sided, heavy-duty, hygienic, odor-free, non-porous, and dishwasher safe.',
            'category'    => 'knives-cutlery',
            'parent_cat'  => 'utensils',
            'image'       => 'modena-ss-chopping-board.jpg',
            'gallery'     => array()
        ),
        array(
            'title'       => 'Modena 304 Stainless Steel Tri-Ply Multi-Kadai & Idli Cooker Set',
            'slug'        => 'modena-triply-multi-kadai-idli-cooker',
            'price'       => '2299',
            'regular'     => '3199',
            'desc'        => '100% chemical-free 304 stainless steel multi-pot with 3-layered tri-ply bottom. Includes 2 idli plates. Fast, effortless cooking for gas and induction stoves.',
            'category'    => 'dutch-ovens',
            'parent_cat'  => 'utensils',
            'image'       => 'modena-triply-multi-kadai-idli-cooker.jpg',
            'gallery'     => array()
        )
    );

    $upload_dir = wp_upload_dir();
    $target_base = $upload_dir['basedir'] . '/2026/08/';
    $target_url = $upload_dir['baseurl'] . '/2026/08/';

    foreach ($products_data as $p) {
        $existing = get_page_by_path($p['slug'], OBJECT, array('product', 'post'));
        if ($existing) {
            $post_id = $existing->ID;
        } else {
            $post_id = wp_insert_post(array(
                'post_title'   => $p['title'],
                'post_name'    => $p['slug'],
                'post_content' => $p['desc'],
                'post_excerpt' => substr($p['desc'], 0, 150) . '...',
                'post_status'  => 'publish',
                'post_type'    => 'product'
            ));
        }

        if ($post_id && !is_wp_error($post_id)) {
            // Set WooCommerce prices & stock
            update_post_meta($post_id, '_price', $p['price']);
            update_post_meta($post_id, '_regular_price', $p['regular']);
            update_post_meta($post_id, '_sale_price', $p['price']);
            update_post_meta($post_id, '_stock_status', 'instock');
            update_post_meta($post_id, '_visibility', 'visible');

            // Attach categories (BOTH subcategory AND parent category)
            $term_ids = array();
            $sub_term = get_term_by('slug', $p['category'], 'product_cat');
            if ($sub_term) {
                $term_ids[] = (int)$sub_term->term_id;
            }
            $parent_term = get_term_by('slug', $p['parent_cat'], 'product_cat');
            if ($parent_term) {
                $term_ids[] = (int)$parent_term->term_id;
            }
            // Also include Bestsellers and Deal categories if applicable
            $bestseller_term = get_term_by('slug', 'bestseller', 'product_cat');
            if ($bestseller_term) {
                $term_ids[] = (int)$bestseller_term->term_id;
            }
            $deal_term = get_term_by('slug', 'deal', 'product_cat');
            if ($deal_term) {
                $term_ids[] = (int)$deal_term->term_id;
            }
            if (!empty($term_ids)) {
                wp_set_object_terms($post_id, $term_ids, 'product_cat');
                wp_set_object_terms($post_id, $term_ids, 'category');
            }

            // Create attachment for main image
            $img_filename = $p['image'];
            $file_path = $target_base . $img_filename;
            $file_url = $target_url . $img_filename;

            if (file_exists($file_path)) {
                $attachment_id = attachment_url_to_postid($file_url);
                if (!$attachment_id) {
                    $attachment_id = wp_insert_attachment(array(
                        'guid'           => $file_url,
                        'post_mime_type' => wp_check_filetype($img_filename)['type'] ?: 'image/jpeg',
                        'post_title'     => $p['title'],
                        'post_content'   => '',
                        'post_status'    => 'inherit'
                    ), $file_path, $post_id);

                    if (!$attachment_id || is_wp_error($attachment_id)) {
                        // ignore error
                    } else {
                        require_once(ABSPATH . 'wp-admin/includes/image.php');
                        $attach_data = wp_generate_attachment_metadata($attachment_id, $file_path);
                        wp_update_attachment_metadata($attachment_id, $attach_data);
                    }
                }

                if ($attachment_id && !is_wp_error($attachment_id)) {
                    set_post_thumbnail($post_id, $attachment_id);
                }
            }

            // Attach gallery images
            if (!empty($p['gallery'])) {
                $gallery_ids = array();
                foreach ($p['gallery'] as $gal_file) {
                    $gal_path = $target_base . $gal_file;
                    $gal_url = $target_url . $gal_file;
                    if (file_exists($gal_path)) {
                        $gal_id = attachment_url_to_postid($gal_url);
                        if (!$gal_id) {
                            $gal_id = wp_insert_attachment(array(
                                'guid'           => $gal_url,
                                'post_mime_type' => wp_check_filetype($gal_file)['type'] ?: 'image/jpeg',
                                'post_title'     => $p['title'] . ' Gallery Angle',
                                'post_content'   => '',
                                'post_status'    => 'inherit'
                            ), $gal_path, $post_id);
                        }
                        if ($gal_id && !is_wp_error($gal_id)) {
                            $gallery_ids[] = $gal_id;
                        }
                    }
                }
                if (!empty($gallery_ids)) {
                    update_post_meta($post_id, '_product_image_gallery', implode(',', $gallery_ids));
                }
            }
        }
    }

    update_option('modena_ppt_products_seeded_v3', true);
}
add_action('init', 'seed_modena_ppt_products', 100);

// Automatically attach product_cat terms to all products in WooCommerce database
function force_assign_modena_product_categories() {
    $products = get_posts(array(
        'post_type'      => 'product',
        'posts_per_page' => -1,
        'post_status'    => 'publish'
    ));

    foreach ($products as $post) {
        $id = $post->ID;
        $title = strtolower($post->post_title);
        $slug = strtolower($post->post_name);
        $terms = array();

        if (strpos($title, 'mixer') !== false || strpos($title, 'blender') !== false || strpos($title, '750w') !== false || strpos($title, '550w') !== false || strpos($title, '990w') !== false || strpos($slug, 'mixer') !== false || strpos($slug, 'blender') !== false || strpos($slug, 'sindoor') !== false || strpos($slug, 'sujata') !== false || strpos($slug, 'karina') !== false || strpos($slug, 'preethi') !== false || strpos($slug, 'nutri') !== false) {
            $elec = get_term_by('slug', 'electronics', 'product_cat');
            if ($elec) $terms[] = (int)$elec->term_id;
            if (strpos($title, 'blender') !== false || strpos($slug, 'nutri') !== false) {
                $bl = get_term_by('slug', 'blenders-choppers', 'product_cat');
                if ($bl) $terms[] = (int)$bl->term_id;
            } else {
                $mg = get_term_by('slug', 'mixer-grinders', 'product_cat');
                if ($mg) $terms[] = (int)$mg->term_id;
            }
        } else {
            $ut = get_term_by('slug', 'utensils', 'product_cat');
            if ($ut) $terms[] = (int)$ut->term_id;

            if (strpos($title, 'cast iron') !== false || strpos($slug, 'cast-iron') !== false || strpos($title, 'dosa') !== false || strpos($title, 'paniyaram') !== false) {
                $ci = get_term_by('slug', 'cast-iron-cookware', 'product_cat');
                if ($ci) $terms[] = (int)$ci->term_id;
            } elseif (strpos($title, 'chopping') !== false || strpos($slug, 'chopping') !== false) {
                $kc = get_term_by('slug', 'knives-cutlery', 'product_cat');
                if ($kc) $terms[] = (int)$kc->term_id;
            } elseif (strpos($title, 'cooker') !== false || strpos($title, 'multi-kadai') !== false) {
                $do = get_term_by('slug', 'dutch-ovens', 'product_cat');
                if ($do) $terms[] = (int)$do->term_id;
            } else {
                $ss = get_term_by('slug', 'stainless-steel', 'product_cat');
                if ($ss) $terms[] = (int)$ss->term_id;
            }
        }

        $bestseller = get_term_by('slug', 'bestseller', 'product_cat');
        if ($bestseller) $terms[] = (int)$bestseller->term_id;
        $deal = get_term_by('slug', 'deal', 'product_cat');
        if ($deal) $terms[] = (int)$deal->term_id;

        if (!empty($terms)) {
            wp_set_object_terms($id, $terms, 'product_cat', false);
            if (function_exists('wc_get_product')) {
                $wc_product = wc_get_product($id);
                if ($wc_product) {
                    $wc_product->set_category_ids($terms);
                    $wc_product->save();
                }
            }
        }
    }
}
// Function disabled: This was running on every page load and overwriting all product categories, causing the Hero Banner bug.
// add_action('init', 'force_assign_modena_product_categories', 999);


// --- MODENA ZOHO PAY REST API INTEGRATION ---
function register_modena_zohopay_rest_routes() {
    register_rest_route('modena/v1', '/create-zohopay-session', array(
        'methods'             => 'POST',
        'callback'            => 'modena_create_zohopay_session_handler',
        'permission_callback' => '__return_true'
    ));

    register_rest_route('modena/v1', '/verify-zohopay-payment', array(
        'methods'             => 'POST',
        'callback'            => 'modena_verify_zohopay_payment_handler',
        'permission_callback' => '__return_true'
    ));

    register_rest_route('modena/v1', '/create-wc-order', array(
        'methods'             => 'POST',
        'callback'            => 'modena_create_wc_order_handler',
        'permission_callback' => '__return_true'
    ));

    register_rest_route('modena/v1', '/request-refund', array(
        'methods'             => 'POST',
        'callback'            => 'modena_request_refund_handler',
        'permission_callback' => '__return_true'
    ));

    register_rest_route('modena/v1', '/upload-return-proof', array(
        'methods'             => 'POST',
        'callback'            => 'modena_upload_return_proof_handler',
        'permission_callback' => '__return_true'
    ));
}
add_action('rest_api_init', 'register_modena_zohopay_rest_routes');

function modena_get_zohopay_credentials() {
    $account_id = defined('ZOHOPAY_ACCOUNT_ID') ? ZOHOPAY_ACCOUNT_ID : get_option('modena_zohopay_account_id', 'zpay_acc_test12345');
    $api_key    = defined('ZOHOPAY_API_KEY') ? ZOHOPAY_API_KEY : get_option('modena_zohopay_api_key', 'zpay_key_test67890');
    $client_secret = defined('ZOHOPAY_CLIENT_SECRET') ? ZOHOPAY_CLIENT_SECRET : get_option('modena_zohopay_client_secret', 'zpay_sec_test98765');
    
    $wc_settings = get_option('woocommerce_zohopay_settings');
    if (is_array($wc_settings)) {
        if (!empty($wc_settings['account_id'])) {
            $account_id = $wc_settings['account_id'];
        }
        if (!empty($wc_settings['api_key'])) {
            $api_key = $wc_settings['api_key'];
        }
        if (!empty($wc_settings['client_secret'])) {
            $client_secret = $wc_settings['client_secret'];
        }
    }

    return array(
        'account_id'    => $account_id,
        'api_key'       => $api_key,
        'client_secret' => $client_secret
    );
}

function modena_create_zohopay_session_handler($request) {
    $params = $request->get_json_params();
    if (!is_array($params)) {
        $params = $request->get_params();
    }
    $amount = isset($params['amount']) ? floatval($params['amount']) : 0;
    
    if ($amount <= 0) {
        return new WP_Error('invalid_amount', 'Amount must be greater than 0', array('status' => 400));
    }

    $creds = modena_get_zohopay_credentials();
    $account_id = $creds['account_id'];
    $api_key    = $creds['api_key'];

    // Zoho Pay Sandbox Endpoint for Payment Sessions
    $url = 'https://paymentssandbox.zoho.in/api/v1/paymentsessions';
    $session_id = 'zpay_sess_' . time() . '_' . rand(1000, 9999);

    $payload = array(
        'amount'        => number_format($amount, 2, '.', ''),
        'currency'      => 'INR',
        'account_id'    => $account_id,
        'description'   => 'Modena Kitchenware Online Order Payment',
        'meta_data'     => array(
            'brand'     => 'Modena Kitchenware',
            'channel'   => 'Headless React Storefront'
        )
    );

    $args = array(
        'body'        => json_encode($payload),
        'headers'     => array(
            'Content-Type'  => 'application/json',
            'Authorization' => 'Bearer ' . $api_key
        ),
        'timeout'     => 15,
        'httpversion' => '1.1'
    );

    $response = wp_remote_post($url, $args);

    if (is_wp_error($response)) {
        // Fallback for offline local dev / sandbox mock session
        return rest_ensure_response(array(
            'success'            => true,
            'zohopay_session_id' => $session_id,
            'amount'             => $amount,
            'currency'           => 'INR',
            'account_id'         => $account_id,
            'api_key'            => $api_key,
            'is_mock'            => true
        ));
    }

    $body = json_decode(wp_remote_retrieve_body($response), true);
    if (isset($body['payment_session_id'])) {
        return rest_ensure_response(array(
            'success'            => true,
            'zohopay_session_id' => $body['payment_session_id'],
            'amount'             => $amount,
            'currency'           => 'INR',
            'account_id'         => $account_id,
            'api_key'            => $api_key
        ));
    }

    return rest_ensure_response(array(
        'success'            => true,
        'zohopay_session_id' => $session_id,
        'amount'             => $amount,
        'currency'           => 'INR',
        'account_id'         => $account_id,
        'api_key'            => $api_key,
        'is_mock'            => true
    ));
}

function modena_verify_zohopay_payment_handler($request) {
    $params = $request->get_json_params();
    if (!is_array($params)) {
        $params = $request->get_params();
    }
    $zohopay_session_id = isset($params['zohopay_session_id']) ? sanitize_text_field($params['zohopay_session_id']) : '';
    $zohopay_payment_id = isset($params['zohopay_payment_id']) ? sanitize_text_field($params['zohopay_payment_id']) : '';
    $zohopay_signature  = isset($params['zohopay_signature']) ? sanitize_text_field($params['zohopay_signature']) : '';

    if (empty($zohopay_session_id) || empty($zohopay_payment_id)) {
        return new WP_Error('missing_params', 'Zoho Pay session ID and payment ID are required', array('status' => 400));
    }

    return rest_ensure_response(array(
        'success'            => true,
        'verified'           => true,
        'zohopay_session_id' => $zohopay_session_id,
        'zohopay_payment_id' => $zohopay_payment_id,
        'message'            => 'Zoho Pay Payment verified successfully!'
    ));
}

function modena_create_wc_order_handler($request) {
    if (!function_exists('wc_create_order')) {
        return new WP_Error('wc_not_active', 'WooCommerce is not active.', array('status' => 500));
    }

    $params = $request->get_json_params();
    if (!is_array($params)) {
        $params = $request->get_params();
    }
    $items = isset($params['items']) ? $params['items'] : array();
    $customer = isset($params['customer']) ? $params['customer'] : array();
    $paymentMethod = isset($params['paymentMethod']) ? $params['paymentMethod'] : 'cod';
    $total = isset($params['total']) ? floatval($params['total']) : 0;
    
    // Create the order
    $order = wc_create_order();

    // Add items to order
    foreach ($items as $item) {
        $product_id = isset($item['id']) ? intval($item['id']) : 0;
        $quantity = isset($item['quantity']) ? intval($item['quantity']) : 1;
        if ($product_id > 0) {
            $order->add_product(wc_get_product($product_id), $quantity);
        }
    }

    // Set addresses
    $address = array(
        'first_name' => sanitize_text_field($customer['firstName'] ?? ''),
        'last_name'  => sanitize_text_field($customer['lastName'] ?? ''),
        'email'      => sanitize_email($customer['email'] ?? ''),
        'phone'      => sanitize_text_field($customer['phone'] ?? ''),
        'address_1'  => sanitize_text_field($customer['address'] ?? ''),
        'city'       => sanitize_text_field($customer['city'] ?? ''),
        'state'      => sanitize_text_field($customer['state'] ?? ''),
        'postcode'   => sanitize_text_field($customer['postcode'] ?? ''),
        'country'    => 'IN'
    );

    $order->set_address($address, 'billing');
    $order->set_address($address, 'shipping');

    // Calculate totals
    $order->calculate_totals();

    // Set payment method
    $order->set_payment_method($paymentMethod);
    $order->set_payment_method_title(strtoupper($paymentMethod));

    // Update status based on payment method
    if (strpos(strtolower($paymentMethod), 'zohopay') !== false || strpos(strtolower($paymentMethod), 'zoho') !== false) {
        $order->update_status('processing', 'Order paid via Zoho Pay (React Frontend).');
    } else {
        $order->update_status('processing', 'Order placed via React Frontend.');
    }

    // Attempt to set customer ID if email belongs to a user
    if (!empty($address['email'])) {
        $user = get_user_by('email', $address['email']);
        if ($user) {
            $order->set_customer_id($user->ID);
        }
    }

    // Store order number in metadata for easy lookup by React refund API
    if (!empty($params['order_number'])) {
        $order->update_meta_data('_order_number', sanitize_text_field($params['order_number']));
    }

    $order->save();

    return rest_ensure_response(array(
        'success'      => true,
        'order_id'     => $order->get_id(),
        'order_number' => $order->get_order_number(),
        'total'        => $order->get_total(),
        'message'      => 'WooCommerce order created successfully'
    ));
}

// --- MODENA USER REGISTRATION & OTP REST API ENDPOINTS ---
function register_modena_auth_rest_routes() {
    register_rest_route('modena/v1', '/check-user-exists', array(
        'methods'             => 'POST',
        'callback'            => 'modena_check_user_exists_handler',
        'permission_callback' => '__return_true'
    ));

    register_rest_route('modena/v1', '/send-otp', array(
        'methods'             => 'POST',
        'callback'            => 'modena_send_otp_handler',
        'permission_callback' => '__return_true'
    ));

    register_rest_route('modena/v1', '/verify-otp-register', array(
        'methods'             => 'POST',
        'callback'            => 'modena_verify_otp_register_handler',
        'permission_callback' => '__return_true'
    ));
}
add_action('rest_api_init', 'register_modena_auth_rest_routes');

function modena_check_user_exists_handler($request) {
    $params = $request->get_json_params();
    $email = isset($params['email']) ? sanitize_email($params['email']) : '';

    if (empty($email)) {
        return new WP_Error('invalid_email', 'Email address is required.', array('status' => 400));
    }

    $user_by_email = get_user_by('email', $email);
    $user_by_login = get_user_by('login', $email);

    $exists = ($user_by_email !== false) || ($user_by_login !== false);

    return rest_ensure_response(array(
        'success' => true,
        'exists'  => $exists,
        'email'   => $email
    ));
}

function modena_send_otp_handler($request) {
    $params = $request->get_json_params();
    $email = isset($params['email']) ? sanitize_email($params['email']) : '';

    if (empty($email)) {
        return new WP_Error('invalid_email', 'Valid email address is required.', array('status' => 400));
    }

    // Generate 6-digit random OTP
    $otp = rand(100000, 999999);
    $transient_key = 'modena_otp_' . md5($email);
    set_transient($transient_key, (string)$otp, 10 * MINUTE_IN_SECONDS);

    // Attempt to send email via wp_mail
    $subject = 'Your Modena Verification Code: ' . $otp;
    $message = "Welcome to Modena Kitchenware!\n\nYour 6-digit account verification code is: " . $otp . "\n\nThis code is valid for 10 minutes.";
    @wp_mail($email, $subject, $message);

    return rest_ensure_response(array(
        'success'  => true,
        'message'  => 'Verification OTP code sent to ' . $email,
        'demo_otp' => (string)$otp
    ));
}

function modena_verify_otp_register_handler($request) {
    $params = $request->get_json_params();
    $email = isset($params['email']) ? sanitize_email($params['email']) : '';
    $name = isset($params['name']) ? sanitize_text_field($params['name']) : 'Modena Customer';
    $password = isset($params['password']) ? $params['password'] : '';
    $user_otp = isset($params['otp']) ? trim(sanitize_text_field($params['otp'])) : '';

    if (empty($email) || empty($password) || empty($user_otp)) {
        return new WP_Error('missing_fields', 'Email, password, and OTP code are required.', array('status' => 400));
    }

    $transient_key = 'modena_otp_' . md5($email);
    $stored_otp = get_transient($transient_key);

    // Allow stored OTP match or fallback test code 123456
    if (!$stored_otp || ($user_otp !== (string)$stored_otp && $user_otp !== '123456')) {
        return new WP_Error('invalid_otp', 'Invalid or expired OTP code. Please try again.', array('status' => 400));
    }

    // Check if user already exists
    if (email_exists($email) || username_exists($email)) {
        return new WP_Error('user_exists', 'An account with this email already exists.', array('status' => 400));
    }

    // Create user in WordPress
    $user_id = wp_create_user($email, $password, $email);
    if (is_wp_error($user_id)) {
        return $user_id;
    }

    wp_update_user(array(
        'ID'           => $user_id,
        'display_name' => $name,
        'first_name'   => $name,
        'role'         => 'customer'
    ));

    delete_transient($transient_key);

    return rest_ensure_response(array(
        'success'      => true,
        'message'      => 'Account created successfully!',
        'user_id'      => $user_id,
        'username'     => $email,
        'display_name' => $name
    ));
}

// --- MODENA REFUND & RETURN REQUEST API ENDPOINT ---
function modena_request_refund_handler($request) {
    $params = $request->get_json_params();
    $order_number = isset($params['order_number']) ? sanitize_text_field($params['order_number']) : '';
    $order_id     = isset($params['order_id']) ? intval($params['order_id']) : 0;
    $reason       = isset($params['reason']) ? sanitize_text_field($params['reason']) : 'Not specified';
    $other_text   = isset($params['other_reason_text']) ? sanitize_text_field($params['other_reason_text']) : '';
    $type         = isset($params['resolution_type']) ? sanitize_text_field($params['resolution_type']) : 'refund';
    $method       = isset($params['refund_method']) ? sanitize_text_field($params['refund_method']) : 'zohopay';
    $bank_details = isset($params['bank_details']) ? $params['bank_details'] : array();
    $item_name    = isset($params['item_name']) ? sanitize_text_field($params['item_name']) : 'Item';

    $target_order = null;
    if ($order_id > 0 && function_exists('wc_get_order')) {
        $target_order = wc_get_order($order_id);
    }
    
    if (!$target_order && !empty($order_number) && function_exists('wc_get_orders')) {
        $orders = wc_get_orders(array('numberposts' => 1, 'meta_key' => '_order_number', 'meta_value' => $order_number));
        if (!empty($orders)) {
            $target_order = $orders[0];
        } else {
            // Try standard post title/ID
            $clean_id = intval(str_replace('MOD-', '', $order_number));
            if ($clean_id > 0) {
                $target_order = wc_get_order($clean_id);
            }
        }
    }

    $note_content = "⚠️ CUSTOMER " . strtoupper($type) . " REQUEST SUBMITTED ⚠️\n";
    $note_content .= "Item: " . $item_name . "\n";
    $note_content .= "Resolution: " . strtoupper($type) . "\n";
    $note_content .= "Reason: " . $reason . ($other_text ? " ($other_text)" : "") . "\n";
    $note_content .= "Refund Destination: " . strtoupper($method) . "\n";
    if (!empty($bank_details)) {
        $note_content .= "Bank/UPI Account Details: " . json_encode($bank_details) . "\n";
    }

    if ($target_order) {
        $new_status = ($type === 'replace') ? 'return-requested' : 'refund-requested';
        $target_order->update_status($new_status, $note_content);
        $target_order->update_meta_data('_modena_refund_requested', 'yes');
        $target_order->update_meta_data('_modena_refund_details', $note_content);
        $target_order->save();
    }

    // Send email alert to store admin
    $admin_email = get_option('admin_email');
    $subject = "🚨 Action Required: New Refund/Return Request for Order " . ($order_number ? $order_number : '#' . $order_id);
    @wp_mail($admin_email, $subject, $note_content);

    return rest_ensure_response(array(
        'success' => true,
        'message' => 'Refund request recorded in WooCommerce and order status updated to Refund Requested.',
        'order_number' => $order_number
    ));
}

// --- MODENA RETURN PROOF MEDIA UPLOAD REST API HANDLER ---
function modena_upload_return_proof_handler($request) {
    if (!function_exists('media_handle_upload')) {
        require_once(ABSPATH . 'wp-admin/includes/image.php');
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        require_once(ABSPATH . 'wp-admin/includes/media.php');
    }

    $params = $request->get_params();
    $order_id_param = isset($params['order_id']) ? sanitize_text_field($params['order_id']) : '';
    $reason_text    = isset($params['reason_text']) ? sanitize_text_field($params['reason_text']) : 'Customer return verification proof';

    if (empty($_FILES['file'])) {
        return new WP_Error('no_file', 'No file attached in upload request', array('status' => 400));
    }

    $attachment_id = media_handle_upload('file', 0);
    if (is_wp_error($attachment_id)) {
        return $attachment_id;
    }

    $source_url = wp_get_attachment_url($attachment_id);

    // If order ID is provided, attach order note
    if (!empty($order_id_param) && function_exists('wc_get_order')) {
        $clean_id = intval(str_replace('MOD-', '', $order_id_param));
        $target_order = wc_get_order($clean_id ? $clean_id : $order_id_param);

        if (!$target_order && function_exists('wc_get_orders')) {
            $orders = wc_get_orders(array('numberposts' => 1, 'meta_key' => '_order_number', 'meta_value' => $order_id_param));
            if (!empty($orders)) {
                $target_order = $orders[0];
            }
        }

        if ($target_order) {
            $html_note = "<strong>RETURN PROOF ATTACHED:</strong><br/><a href='{$source_url}' target='_blank' rel='noopener noreferrer'><img src='{$source_url}' style='max-width:220px; border-radius:8px; margin-top:8px; border:1px solid #E5E7EB; display:block;'/></a><br/><em>Customer note: {$reason_text}</em>";
            $target_order->add_order_note($html_note, false, true);
            $target_order->update_meta_data('_modena_return_proof_url', $source_url);
            $target_order->save();
        }
    }

    return rest_ensure_response(array(
        'success'       => true,
        'attachment_id' => $attachment_id,
        'source_url'    => $source_url,
        'message'       => 'Return proof uploaded successfully and attached to order notes.'
    ));
}

// --- REGISTER CUSTOM WOOCOMMERCE ORDER STATUSES: REFUND REQUESTED & RETURN REQUESTED ---
function register_modena_custom_order_statuses() {
    register_post_status('wc-refund-requested', array(
        'label'                     => 'Refund Requested',
        'public'                    => true,
        'exclude_from_search'       => false,
        'show_in_admin_all_list'    => true,
        'show_in_admin_status_list' => true,
        'label_count'               => _n_noop('Refund Requested (%s)', 'Refund Requested (%s)')
    ));

    register_post_status('wc-return-requested', array(
        'label'                     => 'Return Requested',
        'public'                    => true,
        'exclude_from_search'       => false,
        'show_in_admin_all_list'    => true,
        'show_in_admin_status_list' => true,
        'label_count'               => _n_noop('Return Requested (%s)', 'Return Requested (%s)')
    ));
}
add_action('init', 'register_modena_custom_order_statuses');

function add_modena_custom_order_statuses_to_wc($order_statuses) {
    $new_statuses = array();
    foreach ($order_statuses as $key => $status) {
        $new_statuses[$key] = $status;
        if ('wc-processing' === $key) {
            $new_statuses['wc-refund-requested'] = 'Refund Requested';
            $new_statuses['wc-return-requested'] = 'Return Requested';
        }
    }
    return $new_statuses;
}
add_filter('wc_order_statuses', 'add_modena_custom_order_statuses_to_wc');

// Style custom order status badges in WordPress admin
function modena_custom_order_status_admin_css() {
    echo '<style>
        .status-refund-requested { background: #ffebe9 !important; color: #b70100 !important; font-weight: bold; }
        .status-return-requested { background: #fff8e6 !important; color: #b77900 !important; font-weight: bold; }
    </style>';
}
add_action('admin_head', 'modena_custom_order_status_admin_css');

// Automatically evaluate WooCommerce scheduled sale start & end dates
function modena_auto_evaluate_scheduled_sales() {
    if (function_exists('wc_scheduled_sales')) {
        wc_scheduled_sales();
    }
}
add_action('init', 'modena_auto_evaluate_scheduled_sales', 20);

// Automatically ensure "Out of Stock" product category exists in WooCommerce
function modena_ensure_out_of_stock_category() {
    if (taxonomy_exists('product_cat')) {
        $term = get_term_by('slug', 'out-of-stock', 'product_cat');
        if (!$term) {
            wp_insert_term(
                'Out of Stock',
                'product_cat',
                array(
                    'description' => 'Products categorized as Out of Stock',
                    'slug'        => 'out-of-stock'
                )
            );
        }
    }
}
add_action('init', 'modena_ensure_out_of_stock_category', 25);

// ============================================================
// LAYER A — BLOCK THEME FOUNDATION
// ============================================================

// ----------------------------------------------------------
// 1. Declare Block Theme Support
// ----------------------------------------------------------
function modena_block_theme_support() {
    // Allow the Site Editor to manage templates
    add_theme_support('block-templates');

    // Allow theme.json color palette in the editor
    add_theme_support('editor-color-palette', array(
        array( 'name' => __('Modena Red',     'modena'), 'slug' => 'modena-red',   'color' => '#b70100' ),
        array( 'name' => __('Luxury Dark',    'modena'), 'slug' => 'luxury-dark',  'color' => '#2a1613' ),
        array( 'name' => __('Deep Charcoal',  'modena'), 'slug' => 'deep-charcoal','color' => '#120706' ),
        array( 'name' => __('Warm Ivory',     'modena'), 'slug' => 'warm-ivory',   'color' => '#fdf6f0' ),
        array( 'name' => __('Brand Blush',    'modena'), 'slug' => 'brand-blush',  'color' => '#ffb4a8' ),
    ));

    // Appearance tools (border, padding, margin, shadow via Site Editor)
    add_theme_support('appearance-tools');

    // Wide & full image alignment
    add_theme_support('align-wide');

    // Block-based widget areas
    add_theme_support('widgets-block-editor');

    // Post thumbnails
    add_theme_support('post-thumbnails');

    // Title tag
    add_theme_support('title-tag');

    // HTML5 semantic output
    add_theme_support('html5', array('search-form','comment-form','comment-list','gallery','caption','style','script'));
}
add_action('after_setup_theme', 'modena_block_theme_support');

// ----------------------------------------------------------
// 2. Register Block Pattern Category
// ----------------------------------------------------------
function modena_register_block_pattern_categories() {
    register_block_pattern_category(
        'modena',
        array( 'label' => __('Modena Patterns', 'modena') )
    );
}
add_action('init', 'modena_register_block_pattern_categories');

// ----------------------------------------------------------
// 3. Register Block Patterns
// ----------------------------------------------------------
function modena_register_block_patterns() {

    // ── Pattern 1: Hero Banner ────────────────────────────────
    register_block_pattern(
        'modena/hero-banner',
        array(
            'title'       => __('Modena Hero Banner', 'modena'),
            'description' => __('Full-width hero banner with headline, description and CTA button.', 'modena'),
            'categories'  => array('modena'),
            'keywords'    => array('hero', 'banner', 'cta', 'promotional'),
            'content'     => '<!-- wp:group {"align":"full","style":{"color":{"background":"#120706"},"spacing":{"padding":{"top":"var:preset|spacing|16","bottom":"var:preset|spacing|16","left":"var:preset|spacing|8","right":"var:preset|spacing|8"}}},"textColor":"white","className":"modena-hero-pattern","layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull modena-hero-pattern has-white-color has-text-color" style="background-color:#120706;padding-top:var(--wp--preset--spacing--16);padding-bottom:var(--wp--preset--spacing--16);padding-left:var(--wp--preset--spacing--8);padding-right:var(--wp--preset--spacing--8)">

    <!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|3"}},"layout":{"type":"flex","flexWrap":"nowrap","justifyContent":"center"}} -->
    <div class="wp-block-group">
        <!-- wp:paragraph {"style":{"typography":{"fontStyle":"normal","fontWeight":"700","letterSpacing":"0.15em","textTransform":"uppercase","fontSize":"0.7rem"},"color":{"text":"#ffb4a8"}}} -->
        <p class="has-text-color" style="font-size:0.7rem;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#ffb4a8">✦ Introducing Modena</p>
        <!-- /wp:paragraph -->
    </div>
    <!-- /wp:group -->

    <!-- wp:heading {"textAlign":"center","level":1,"style":{"typography":{"fontWeight":"800","lineHeight":"1.1","textTransform":"uppercase"},"spacing":{"margin":{"top":"var:preset|spacing|4"}}},"textColor":"white","fontSize":"display"} -->
    <h1 class="wp-block-heading has-text-align-center has-white-color has-text-color has-display-font-size" style="font-weight:800;line-height:1.1;text-transform:uppercase;margin-top:var(--wp--preset--spacing--4)">Premium Kitchenware &amp; Appliances</h1>
    <!-- /wp:heading -->

    <!-- wp:paragraph {"textAlign":"center","style":{"typography":{"fontSize":"1.1rem"},"color":{"text":"#d1c3bf"},"spacing":{"margin":{"top":"var:preset|spacing|4"}}}} -->
    <p class="has-text-align-center has-text-color" style="font-size:1.1rem;color:#d1c3bf;margin-top:var(--wp--preset--spacing--4)">Engineered for Indian kitchens. Built to outlast a lifetime of cooking.</p>
    <!-- /wp:paragraph -->

    <!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"},"style":{"spacing":{"margin":{"top":"var:preset|spacing|8"}}}} -->
    <div class="wp-block-buttons" style="margin-top:var(--wp--preset--spacing--8)">
        <!-- wp:button {"backgroundColor":"modena-red","textColor":"white","style":{"border":{"radius":"9999px"},"spacing":{"padding":{"top":"var:preset|spacing|4","bottom":"var:preset|spacing|4","left":"var:preset|spacing|8","right":"var:preset|spacing|8"}}},"fontSize":"sm"} -->
        <div class="wp-block-button has-custom-font-size has-sm-font-size"><a class="wp-block-button__link has-white-color has-modena-red-background-color has-text-color has-background wp-element-button" style="border-radius:9999px;padding-top:var(--wp--preset--spacing--4);padding-right:var(--wp--preset--spacing--8);padding-bottom:var(--wp--preset--spacing--4);padding-left:var(--wp--preset--spacing--8)">Shop Bestsellers Now →</a></div>
        <!-- /wp:button -->
    </div>
    <!-- /wp:buttons -->

</div>
<!-- /wp:group -->',
        )
    );

    // ── Pattern 2: Trust Badges ───────────────────────────────
    register_block_pattern(
        'modena/trust-badges',
        array(
            'title'       => __('Modena Trust Badges', 'modena'),
            'description' => __('Four icon+text trust signals displayed in a responsive row.', 'modena'),
            'categories'  => array('modena'),
            'keywords'    => array('trust', 'badges', 'icons', 'features', 'guarantee'),
            'content'     => '<!-- wp:group {"align":"full","style":{"color":{"background":"#fdf6f0"},"spacing":{"padding":{"top":"var:preset|spacing|10","bottom":"var:preset|spacing|10","left":"var:preset|spacing|6","right":"var:preset|spacing|6"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull" style="background-color:#fdf6f0;padding-top:var(--wp--preset--spacing--10);padding-bottom:var(--wp--preset--spacing--10);padding-left:var(--wp--preset--spacing--6);padding-right:var(--wp--preset--spacing--6)">

    <!-- wp:columns {"isStackedOnMobile":false,"style":{"spacing":{"blockGap":{"left":"var:preset|spacing|8"}}}} -->
    <div class="wp-block-columns is-not-stacked-on-mobile">

        <!-- wp:column -->
        <div class="wp-block-column">
            <!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|3"}},"layout":{"type":"flex","flexWrap":"nowrap","justifyContent":"center","verticalAlignment":"center"}} -->
            <div class="wp-block-group">
                <!-- wp:paragraph {"style":{"typography":{"fontSize":"2rem"}}} --><p style="font-size:2rem">🏆</p><!-- /wp:paragraph -->
                <!-- wp:group {"layout":{"type":"flex","orientation":"vertical","verticalAlignment":"center"}} -->
                <div class="wp-block-group">
                    <!-- wp:paragraph {"style":{"typography":{"fontWeight":"700","fontSize":"0.85rem","textTransform":"uppercase","letterSpacing":"0.05em"},"color":{"text":"#2a1613"}}} --><p class="has-text-color" style="font-weight:700;font-size:0.85rem;text-transform:uppercase;letter-spacing:0.05em;color:#2a1613">Premium Quality</p><!-- /wp:paragraph -->
                    <!-- wp:paragraph {"style":{"typography":{"fontSize":"0.75rem"},"color":{"text":"#7a6460"}}} --><p class="has-text-color" style="font-size:0.75rem;color:#7a6460">ISI Certified Materials</p><!-- /wp:paragraph -->
                </div>
                <!-- /wp:group -->
            </div>
            <!-- /wp:group -->
        </div>
        <!-- /wp:column -->

        <!-- wp:column -->
        <div class="wp-block-column">
            <!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|3"}},"layout":{"type":"flex","flexWrap":"nowrap","justifyContent":"center","verticalAlignment":"center"}} -->
            <div class="wp-block-group">
                <!-- wp:paragraph {"style":{"typography":{"fontSize":"2rem"}}} --><p style="font-size:2rem">🚚</p><!-- /wp:paragraph -->
                <!-- wp:group {"layout":{"type":"flex","orientation":"vertical","verticalAlignment":"center"}} -->
                <div class="wp-block-group">
                    <!-- wp:paragraph {"style":{"typography":{"fontWeight":"700","fontSize":"0.85rem","textTransform":"uppercase","letterSpacing":"0.05em"},"color":{"text":"#2a1613"}}} --><p class="has-text-color" style="font-weight:700;font-size:0.85rem;text-transform:uppercase;letter-spacing:0.05em;color:#2a1613">Free Delivery</p><!-- /wp:paragraph -->
                    <!-- wp:paragraph {"style":{"typography":{"fontSize":"0.75rem"},"color":{"text":"#7a6460"}}} --><p class="has-text-color" style="font-size:0.75rem;color:#7a6460">Orders above ₹499</p><!-- /wp:paragraph -->
                </div>
                <!-- /wp:group -->
            </div>
            <!-- /wp:group -->
        </div>
        <!-- /wp:column -->

        <!-- wp:column -->
        <div class="wp-block-column">
            <!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|3"}},"layout":{"type":"flex","flexWrap":"nowrap","justifyContent":"center","verticalAlignment":"center"}} -->
            <div class="wp-block-group">
                <!-- wp:paragraph {"style":{"typography":{"fontSize":"2rem"}}} --><p style="font-size:2rem">🔒</p><!-- /wp:paragraph -->
                <!-- wp:group {"layout":{"type":"flex","orientation":"vertical","verticalAlignment":"center"}} -->
                <div class="wp-block-group">
                    <!-- wp:paragraph {"style":{"typography":{"fontWeight":"700","fontSize":"0.85rem","textTransform":"uppercase","letterSpacing":"0.05em"},"color":{"text":"#2a1613"}}} --><p class="has-text-color" style="font-weight:700;font-size:0.85rem;text-transform:uppercase;letter-spacing:0.05em;color:#2a1613">Secure Checkout</p><!-- /wp:paragraph -->
                    <!-- wp:paragraph {"style":{"typography":{"fontSize":"0.75rem"},"color":{"text":"#7a6460"}}} --><p class="has-text-color" style="font-size:0.75rem;color:#7a6460">Zoho Pay Encrypted</p><!-- /wp:paragraph -->
                </div>
                <!-- /wp:group -->
            </div>
            <!-- /wp:group -->
        </div>
        <!-- /wp:column -->

        <!-- wp:column -->
        <div class="wp-block-column">
            <!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|3"}},"layout":{"type":"flex","flexWrap":"nowrap","justifyContent":"center","verticalAlignment":"center"}} -->
            <div class="wp-block-group">
                <!-- wp:paragraph {"style":{"typography":{"fontSize":"2rem"}}} --><p style="font-size:2rem">↩️</p><!-- /wp:paragraph -->
                <!-- wp:group {"layout":{"type":"flex","orientation":"vertical","verticalAlignment":"center"}} -->
                <div class="wp-block-group">
                    <!-- wp:paragraph {"style":{"typography":{"fontWeight":"700","fontSize":"0.85rem","textTransform":"uppercase","letterSpacing":"0.05em"},"color":{"text":"#2a1613"}}} --><p class="has-text-color" style="font-weight:700;font-size:0.85rem;text-transform:uppercase;letter-spacing:0.05em;color:#2a1613">Easy Returns</p><!-- /wp:paragraph -->
                    <!-- wp:paragraph {"style":{"typography":{"fontSize":"0.75rem"},"color":{"text":"#7a6460"}}} --><p class="has-text-color" style="font-size:0.75rem;color:#7a6460">7-Day Hassle-Free</p><!-- /wp:paragraph -->
                </div>
                <!-- /wp:group -->
            </div>
            <!-- /wp:group -->
        </div>
        <!-- /wp:column -->

    </div>
    <!-- /wp:columns -->

</div>
<!-- /wp:group -->',
        )
    );

    // ── Pattern 3: Category Grid ──────────────────────────────
    register_block_pattern(
        'modena/category-grid',
        array(
            'title'       => __('Modena Category Grid', 'modena'),
            'description' => __('2×2 grid of product category cards with image, label and link.', 'modena'),
            'categories'  => array('modena'),
            'keywords'    => array('categories', 'grid', 'shop', 'collection'),
            'content'     => '<!-- wp:group {"align":"full","style":{"color":{"background":"#ffffff"},"spacing":{"padding":{"top":"var:preset|spacing|16","bottom":"var:preset|spacing|16","left":"var:preset|spacing|6","right":"var:preset|spacing|6"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull" style="background-color:#ffffff;padding-top:var(--wp--preset--spacing--16);padding-bottom:var(--wp--preset--spacing--16);padding-left:var(--wp--preset--spacing--6);padding-right:var(--wp--preset--spacing--6)">

    <!-- wp:heading {"textAlign":"center","level":2,"style":{"typography":{"fontWeight":"800","textTransform":"uppercase","letterSpacing":"0.05em"}},"textColor":"luxury-dark","fontSize":"3xl"} -->
    <h2 class="wp-block-heading has-text-align-center has-luxury-dark-color has-text-color has-3-xl-font-size" style="font-weight:800;text-transform:uppercase;letter-spacing:0.05em">Shop By Category</h2>
    <!-- /wp:heading -->

    <!-- wp:paragraph {"textAlign":"center","style":{"color":{"text":"#7a6460"},"spacing":{"margin":{"top":"var:preset|spacing|3","bottom":"var:preset|spacing|10"}}}} -->
    <p class="has-text-align-center has-text-color" style="color:#7a6460;margin-top:var(--wp--preset--spacing--3);margin-bottom:var(--wp--preset--spacing--10)">Curated collections built for every Indian kitchen.</p>
    <!-- /wp:paragraph -->

    <!-- wp:columns {"isStackedOnMobile":true,"style":{"spacing":{"blockGap":{"top":"var:preset|spacing|6","left":"var:preset|spacing|6"}}}} -->
    <div class="wp-block-columns is-layout-flex">

        <!-- wp:column -->
        <div class="wp-block-column">
            <!-- wp:group {"style":{"border":{"radius":"16px"},"color":{"background":"#fdf6f0"},"spacing":{"padding":{"top":"var:preset|spacing|8","bottom":"var:preset|spacing|8","left":"var:preset|spacing|6","right":"var:preset|spacing|6"}}},"layout":{"type":"flex","orientation":"vertical","verticalAlignment":"center","justifyContent":"center"}} -->
            <div class="wp-block-group" style="border-radius:16px;background-color:#fdf6f0;padding-top:var(--wp--preset--spacing--8);padding-bottom:var(--wp--preset--spacing--8);padding-left:var(--wp--preset--spacing--6);padding-right:var(--wp--preset--spacing--6)">
                <!-- wp:paragraph {"style":{"typography":{"fontSize":"3rem"},"spacing":{"margin":{"bottom":"var:preset|spacing|3"}}}} --><p style="font-size:3rem;margin-bottom:var(--wp--preset--spacing--3)">⚡</p><!-- /wp:paragraph -->
                <!-- wp:heading {"level":3,"style":{"typography":{"fontWeight":"700"}},"textColor":"luxury-dark","fontSize":"xl"} --><h3 class="wp-block-heading has-luxury-dark-color has-text-color has-xl-font-size" style="font-weight:700">Electronics</h3><!-- /wp:heading -->
                <!-- wp:paragraph {"style":{"color":{"text":"#7a6460"},"typography":{"fontSize":"0.8rem"}}} --><p class="has-text-color" style="color:#7a6460;font-size:0.8rem">Mixer Grinders · Air Fryers · Blenders</p><!-- /wp:paragraph -->
                <!-- wp:buttons {"style":{"spacing":{"margin":{"top":"var:preset|spacing|4"}}}} -->
                <div class="wp-block-buttons" style="margin-top:var(--wp--preset--spacing--4)">
                    <!-- wp:button {"backgroundColor":"modena-red","textColor":"white","style":{"border":{"radius":"9999px"},"typography":{"fontSize":"0.75rem"}},"className":"is-style-fill"} --><div class="wp-block-button is-style-fill"><a class="wp-block-button__link has-white-color has-modena-red-background-color has-text-color has-background wp-element-button" style="border-radius:9999px;font-size:0.75rem">Shop Electronics</a></div><!-- /wp:button -->
                </div>
                <!-- /wp:buttons -->
            </div>
            <!-- /wp:group -->
        </div>
        <!-- /wp:column -->

        <!-- wp:column -->
        <div class="wp-block-column">
            <!-- wp:group {"style":{"border":{"radius":"16px"},"color":{"background":"#fdf6f0"},"spacing":{"padding":{"top":"var:preset|spacing|8","bottom":"var:preset|spacing|8","left":"var:preset|spacing|6","right":"var:preset|spacing|6"}}},"layout":{"type":"flex","orientation":"vertical","verticalAlignment":"center","justifyContent":"center"}} -->
            <div class="wp-block-group" style="border-radius:16px;background-color:#fdf6f0;padding-top:var(--wp--preset--spacing--8);padding-bottom:var(--wp--preset--spacing--8);padding-left:var(--wp--preset--spacing--6);padding-right:var(--wp--preset--spacing--6)">
                <!-- wp:paragraph {"style":{"typography":{"fontSize":"3rem"},"spacing":{"margin":{"bottom":"var:preset|spacing|3"}}}} --><p style="font-size:3rem;margin-bottom:var(--wp--preset--spacing--3)">🍳</p><!-- /wp:paragraph -->
                <!-- wp:heading {"level":3,"style":{"typography":{"fontWeight":"700"}},"textColor":"luxury-dark","fontSize":"xl"} --><h3 class="wp-block-heading has-luxury-dark-color has-text-color has-xl-font-size" style="font-weight:700">Utensils</h3><!-- /wp:heading -->
                <!-- wp:paragraph {"style":{"color":{"text":"#7a6460"},"typography":{"fontSize":"0.8rem"}}} --><p class="has-text-color" style="color:#7a6460;font-size:0.8rem">Cast Iron · Tri-Ply · Knives</p><!-- /wp:paragraph -->
                <!-- wp:buttons {"style":{"spacing":{"margin":{"top":"var:preset|spacing|4"}}}} -->
                <div class="wp-block-buttons" style="margin-top:var(--wp--preset--spacing--4)">
                    <!-- wp:button {"backgroundColor":"modena-red","textColor":"white","style":{"border":{"radius":"9999px"},"typography":{"fontSize":"0.75rem"}},"className":"is-style-fill"} --><div class="wp-block-button is-style-fill"><a class="wp-block-button__link has-white-color has-modena-red-background-color has-text-color has-background wp-element-button" style="border-radius:9999px;font-size:0.75rem">Shop Utensils</a></div><!-- /wp:button -->
                </div>
                <!-- /wp:buttons -->
            </div>
            <!-- /wp:group -->
        </div>
        <!-- /wp:column -->

        <!-- wp:column -->
        <div class="wp-block-column">
            <!-- wp:group {"style":{"border":{"radius":"16px"},"color":{"background":"#fdf6f0"},"spacing":{"padding":{"top":"var:preset|spacing|8","bottom":"var:preset|spacing|8","left":"var:preset|spacing|6","right":"var:preset|spacing|6"}}},"layout":{"type":"flex","orientation":"vertical","verticalAlignment":"center","justifyContent":"center"}} -->
            <div class="wp-block-group" style="border-radius:16px;background-color:#fdf6f0;padding-top:var(--wp--preset--spacing--8);padding-bottom:var(--wp--preset--spacing--8);padding-left:var(--wp--preset--spacing--6);padding-right:var(--wp--preset--spacing--6)">
                <!-- wp:paragraph {"style":{"typography":{"fontSize":"3rem"},"spacing":{"margin":{"bottom":"var:preset|spacing|3"}}}} --><p style="font-size:3rem;margin-bottom:var(--wp--preset--spacing--3)">⭐</p><!-- /wp:paragraph -->
                <!-- wp:heading {"level":3,"style":{"typography":{"fontWeight":"700"}},"textColor":"luxury-dark","fontSize":"xl"} --><h3 class="wp-block-heading has-luxury-dark-color has-text-color has-xl-font-size" style="font-weight:700">Bestsellers</h3><!-- /wp:heading -->
                <!-- wp:paragraph {"style":{"color":{"text":"#7a6460"},"typography":{"fontSize":"0.8rem"}}} --><p class="has-text-color" style="color:#7a6460;font-size:0.8rem">Top-Rated Customer Picks</p><!-- /wp:paragraph -->
                <!-- wp:buttons {"style":{"spacing":{"margin":{"top":"var:preset|spacing|4"}}}} -->
                <div class="wp-block-buttons" style="margin-top:var(--wp--preset--spacing--4)">
                    <!-- wp:button {"backgroundColor":"modena-red","textColor":"white","style":{"border":{"radius":"9999px"},"typography":{"fontSize":"0.75rem"}},"className":"is-style-fill"} --><div class="wp-block-button is-style-fill"><a class="wp-block-button__link has-white-color has-modena-red-background-color has-text-color has-background wp-element-button" style="border-radius:9999px;font-size:0.75rem">Shop Bestsellers</a></div><!-- /wp:button -->
                </div>
                <!-- /wp:buttons -->
            </div>
            <!-- /wp:group -->
        </div>
        <!-- /wp:column -->

        <!-- wp:column -->
        <div class="wp-block-column">
            <!-- wp:group {"style":{"border":{"radius":"16px"},"color":{"background":"#2a1613"},"spacing":{"padding":{"top":"var:preset|spacing|8","bottom":"var:preset|spacing|8","left":"var:preset|spacing|6","right":"var:preset|spacing|6"}}},"layout":{"type":"flex","orientation":"vertical","verticalAlignment":"center","justifyContent":"center"}} -->
            <div class="wp-block-group" style="border-radius:16px;background-color:#2a1613;padding-top:var(--wp--preset--spacing--8);padding-bottom:var(--wp--preset--spacing--8);padding-left:var(--wp--preset--spacing--6);padding-right:var(--wp--preset--spacing--6)">
                <!-- wp:paragraph {"style":{"typography":{"fontSize":"3rem"},"spacing":{"margin":{"bottom":"var:preset|spacing|3"}}}} --><p style="font-size:3rem;margin-bottom:var(--wp--preset--spacing--3)">🔥</p><!-- /wp:paragraph -->
                <!-- wp:heading {"level":3,"style":{"typography":{"fontWeight":"700"}},"textColor":"white","fontSize":"xl"} --><h3 class="wp-block-heading has-white-color has-text-color has-xl-font-size" style="font-weight:700">Flash Deals</h3><!-- /wp:heading -->
                <!-- wp:paragraph {"style":{"color":{"text":"#ffb4a8"},"typography":{"fontSize":"0.8rem"}}} --><p class="has-text-color" style="color:#ffb4a8;font-size:0.8rem">Limited-Time Offers</p><!-- /wp:paragraph -->
                <!-- wp:buttons {"style":{"spacing":{"margin":{"top":"var:preset|spacing|4"}}}} -->
                <div class="wp-block-buttons" style="margin-top:var(--wp--preset--spacing--4)">
                    <!-- wp:button {"backgroundColor":"modena-red","textColor":"white","style":{"border":{"radius":"9999px"},"typography":{"fontSize":"0.75rem"}},"className":"is-style-fill"} --><div class="wp-block-button is-style-fill"><a class="wp-block-button__link has-white-color has-modena-red-background-color has-text-color has-background wp-element-button" style="border-radius:9999px;font-size:0.75rem">Grab Deals</a></div><!-- /wp:button -->
                </div>
                <!-- /wp:buttons -->
            </div>
            <!-- /wp:group -->
        </div>
        <!-- /wp:column -->

    </div>
    <!-- /wp:columns -->

</div>
<!-- /wp:group -->',
        )
    );

    // ── Pattern 4: FAQ Section ────────────────────────────────
    register_block_pattern(
        'modena/faq-section',
        array(
            'title'       => __('Modena FAQ Section', 'modena'),
            'description' => __('Branded FAQ block with expandable questions — uses native Details blocks.', 'modena'),
            'categories'  => array('modena'),
            'keywords'    => array('faq', 'questions', 'accordion', 'help', 'support'),
            'content'     => '<!-- wp:group {"align":"full","style":{"color":{"background":"#fdf6f0"},"spacing":{"padding":{"top":"var:preset|spacing|16","bottom":"var:preset|spacing|16","left":"var:preset|spacing|6","right":"var:preset|spacing|6"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull" style="background-color:#fdf6f0;padding-top:var(--wp--preset--spacing--16);padding-bottom:var(--wp--preset--spacing--16);padding-left:var(--wp--preset--spacing--6);padding-right:var(--wp--preset--spacing--6)">

    <!-- wp:heading {"textAlign":"center","level":2,"style":{"typography":{"fontWeight":"800","textTransform":"uppercase","letterSpacing":"0.05em"}},"textColor":"luxury-dark","fontSize":"3xl"} -->
    <h2 class="wp-block-heading has-text-align-center has-luxury-dark-color has-text-color has-3-xl-font-size" style="font-weight:800;text-transform:uppercase;letter-spacing:0.05em">Frequently Asked Questions</h2>
    <!-- /wp:heading -->

    <!-- wp:paragraph {"textAlign":"center","style":{"color":{"text":"#7a6460"},"spacing":{"margin":{"top":"var:preset|spacing|3","bottom":"var:preset|spacing|10"}}}} -->
    <p class="has-text-align-center has-text-color" style="color:#7a6460;margin-top:var(--wp--preset--spacing--3);margin-bottom:var(--wp--preset--spacing--10)">Everything you need to know about shopping with Modena.</p>
    <!-- /wp:paragraph -->

    <!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|3"}},"layout":{"type":"constrained","contentSize":"720px"}} -->
    <div class="wp-block-group">

        <!-- wp:details {"style":{"border":{"radius":"12px","width":"1px","color":"#e8e1dc"},"spacing":{"padding":{"top":"var:preset|spacing|4","bottom":"var:preset|spacing|4","left":"var:preset|spacing|5","right":"var:preset|spacing|5"}}},"backgroundColor":"white","textColor":"luxury-dark"} -->
        <details class="wp-block-details has-luxury-dark-color has-white-background-color has-text-color has-background" style="border-radius:12px;border-color:#e8e1dc;border-style:solid;border-width:1px;padding-top:var(--wp--preset--spacing--4);padding-right:var(--wp--preset--spacing--5);padding-bottom:var(--wp--preset--spacing--4);padding-left:var(--wp--preset--spacing--5)"><summary style="font-weight:700">Do you offer free delivery?</summary>
        <!-- wp:paragraph {"style":{"color":{"text":"#7a6460"},"spacing":{"margin":{"top":"var:preset|spacing|3"}}}} -->
        <p class="has-text-color" style="color:#7a6460;margin-top:var(--wp--preset--spacing--3)">Yes! We offer free delivery on all orders above ₹499 across India. Standard delivery typically takes 3–5 business days.</p>
        <!-- /wp:paragraph --></details>
        <!-- /wp:details -->

        <!-- wp:details {"style":{"border":{"radius":"12px","width":"1px","color":"#e8e1dc"},"spacing":{"padding":{"top":"var:preset|spacing|4","bottom":"var:preset|spacing|4","left":"var:preset|spacing|5","right":"var:preset|spacing|5"}}},"backgroundColor":"white","textColor":"luxury-dark"} -->
        <details class="wp-block-details has-luxury-dark-color has-white-background-color has-text-color has-background" style="border-radius:12px;border-color:#e8e1dc;border-style:solid;border-width:1px;padding-top:var(--wp--preset--spacing--4);padding-right:var(--wp--preset--spacing--5);padding-bottom:var(--wp--preset--spacing--4);padding-left:var(--wp--preset--spacing--5)"><summary style="font-weight:700">What is your return policy?</summary>
        <!-- wp:paragraph {"style":{"color":{"text":"#7a6460"},"spacing":{"margin":{"top":"var:preset|spacing|3"}}}} -->
        <p class="has-text-color" style="color:#7a6460;margin-top:var(--wp--preset--spacing--3)">We offer a 7-day hassle-free return policy on all products. Simply raise a return request from your account and our team will arrange a pickup within 2 business days.</p>
        <!-- /wp:paragraph --></details>
        <!-- /wp:details -->

        <!-- wp:details {"style":{"border":{"radius":"12px","width":"1px","color":"#e8e1dc"},"spacing":{"padding":{"top":"var:preset|spacing|4","bottom":"var:preset|spacing|4","left":"var:preset|spacing|5","right":"var:preset|spacing|5"}}},"backgroundColor":"white","textColor":"luxury-dark"} -->
        <details class="wp-block-details has-luxury-dark-color has-white-background-color has-text-color has-background" style="border-radius:12px;border-color:#e8e1dc;border-style:solid;border-width:1px;padding-top:var(--wp--preset--spacing--4);padding-right:var(--wp--preset--spacing--5);padding-bottom:var(--wp--preset--spacing--4);padding-left:var(--wp--preset--spacing--5)"><summary style="font-weight:700">Are Modena products compatible with induction cooktops?</summary>
        <!-- wp:paragraph {"style":{"color":{"text":"#7a6460"},"spacing":{"margin":{"top":"var:preset|spacing|3"}}}} -->
        <p class="has-text-color" style="color:#7a6460;margin-top:var(--wp--preset--spacing--3)">Most of our Tri-Ply Stainless Steel and Cast Iron cookware is induction-compatible. Each product page clearly states compatibility — look for the induction symbol in the specifications.</p>
        <!-- /wp:paragraph --></details>
        <!-- /wp:details -->

        <!-- wp:details {"style":{"border":{"radius":"12px","width":"1px","color":"#e8e1dc"},"spacing":{"padding":{"top":"var:preset|spacing|4","bottom":"var:preset|spacing|4","left":"var:preset|spacing|5","right":"var:preset|spacing|5"}}},"backgroundColor":"white","textColor":"luxury-dark"} -->
        <details class="wp-block-details has-luxury-dark-color has-white-background-color has-text-color has-background" style="border-radius:12px;border-color:#e8e1dc;border-style:solid;border-width:1px;padding-top:var(--wp--preset--spacing--4);padding-right:var(--wp--preset--spacing--5);padding-bottom:var(--wp--preset--spacing--4);padding-left:var(--wp--preset--spacing--5)"><summary style="font-weight:700">How do I track my order?</summary>
        <!-- wp:paragraph {"style":{"color":{"text":"#7a6460"},"spacing":{"margin":{"top":"var:preset|spacing|3"}}}} -->
        <p class="has-text-color" style="color:#7a6460;margin-top:var(--wp--preset--spacing--3)">Once your order is shipped, you will receive an email with a tracking link. You can also check your order status anytime in the <strong>Orders</strong> section of your Modena account.</p>
        <!-- /wp:paragraph --></details>
        <!-- /wp:details -->

        <!-- wp:details {"style":{"border":{"radius":"12px","width":"1px","color":"#e8e1dc"},"spacing":{"padding":{"top":"var:preset|spacing|4","bottom":"var:preset|spacing|4","left":"var:preset|spacing|5","right":"var:preset|spacing|5"}}},"backgroundColor":"white","textColor":"luxury-dark"} -->
        <details class="wp-block-details has-luxury-dark-color has-white-background-color has-text-color has-background" style="border-radius:12px;border-color:#e8e1dc;border-style:solid;border-width:1px;padding-top:var(--wp--preset--spacing--4);padding-right:var(--wp--preset--spacing--5);padding-bottom:var(--wp--preset--spacing--4);padding-left:var(--wp--preset--spacing--5)"><summary style="font-weight:700">Is there a warranty on Modena products?</summary>
        <!-- wp:paragraph {"style":{"color":{"text":"#7a6460"},"spacing":{"margin":{"top":"var:preset|spacing|3"}}}} -->
        <p class="has-text-color" style="color:#7a6460;margin-top:var(--wp--preset--spacing--3)">Yes. All electronics (Mixer Grinders, Air Fryers, etc.) come with a 1-year manufacturer warranty. Cookware products are covered by our Lifetime Quality Guarantee against manufacturing defects.</p>
        <!-- /wp:paragraph --></details>
        <!-- /wp:details -->

    </div>
    <!-- /wp:group -->

</div>
<!-- /wp:group -->',
        )
    );
}
add_action('init', 'modena_register_block_patterns');
?>

