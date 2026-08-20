<?php
// Prevent wp_mail from blocking on local environments without active SMTP
if (strpos(site_url(), '.local') !== false || strpos(site_url(), 'localhost') !== false) {
    add_filter('pre_wp_mail', '__return_true');
}

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

// Automatically create Prime Categories in WordPress matching Navbar anchors
function seed_modena_woocommerce_categories() {
    $taxonomies = array('category');
    if (taxonomy_exists('product_cat')) {
        $taxonomies[] = 'product_cat';
    }

    $hierarchy = array(
        array(
            'name' => 'Mixer Grinder',
            'slug' => 'mixer-grinder',
            'description' => 'Heavy Duty Motor Mixers & Grinders'
        ),
        array(
            'name' => 'Nutrimix',
            'slug' => 'nutrimix',
            'description' => 'Nutri-Blend High Speed Personal Blenders & Extractors'
        ),
        array(
            'name' => 'Cookware',
            'slug' => 'cookware',
            'description' => 'Tri-Ply Stainless Steel, Cast Iron & Non-Stick Heritage Cookware'
        ),
        array(
            'name' => 'Corporate Gifting',
            'slug' => 'corporate-gifting',
            'description' => 'Curated premium kitchenware for corporate, executive and festive gifting'
        )
    );

    foreach ($taxonomies as $tax) {
        foreach ($hierarchy as $parent_cat) {
            $parent_term = term_exists($parent_cat['slug'], $tax);
            if (!$parent_term) {
                // Check if term exists by name before inserting
                $term_by_name = get_term_by('name', $parent_cat['name'], $tax);
                if ($term_by_name) {
                    wp_update_term($term_by_name->term_id, $tax, array(
                        'slug' => $parent_cat['slug'],
                        'description' => $parent_cat['description']
                    ));
                } else {
                    wp_insert_term(
                        $parent_cat['name'],
                        $tax,
                        array(
                            'slug'        => $parent_cat['slug'],
                            'description' => $parent_cat['description']
                        )
                    );
                }
            }
        }
    }
}
add_action('init', 'seed_modena_woocommerce_categories', 99);

// Ensure Corporate Gifting WooCommerce Category & Initial Gifting Product Multi-Category Assignment
function modena_ensure_corporate_gifting_category() {
    $tax = 'product_cat';
    if (!taxonomy_exists($tax)) {
        return;
    }

    $term = get_term_by('slug', 'corporate-gifting', $tax);
    if (!$term) {
        $inserted = wp_insert_term(
            'Corporate Gifting',
            $tax,
            array(
                'slug'        => 'corporate-gifting',
                'description' => 'Curated premium kitchenware for corporate, executive and festive gifting'
            )
        );
        $term_id = is_array($inserted) ? $inserted['term_id'] : $inserted;
    } else {
        $term_id = $term->term_id;
    }

    if ($term_id && !get_option('modena_corporate_gifting_initial_assigned_v1')) {
        // Assign 5-6 suitable flagship products to Corporate Gifting (append mode keeps existing categories unchanged)
        $posts = get_posts(array(
            'post_type'   => 'product',
            'numberposts' => 6,
            'post_status' => 'publish'
        ));

        foreach ($posts as $p) {
            wp_set_post_terms($p->ID, array(intval($term_id)), $tax, true);
        }

        update_option('modena_corporate_gifting_initial_assigned_v1', 1);
        wp_update_term_count_now(array($term_id), $tax);
    }
}
add_action('init', 'modena_ensure_corporate_gifting_category', 100);

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
            'title'       => 'Modena Pro 3-Jar Stainless Steel Set (Universal Fit)',
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
            'title'       => 'Modena Crystal 3-Jar Set with PC Polycarbonate Lid',
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
            'title'       => 'Modena Classic Heavy-Duty 3-Jar Set',
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
            'desc'        => 'Premium Food-Grade Stainless Steel Chopping Board (41cm x 31cm). Zero chemical coating, no plastic coating where food particles touch. Rust-resistant, double-sided, heavy-duty, hygienic, odor-free, non-porous, and dishwasher safe.',
            'category'    => 'knives-cutlery',
            'parent_cat'  => 'utensils',
            'image'       => 'modena-ss-chopping-board.jpg',
            'gallery'     => array()
        ),
        array(
            'title'       => 'Modena Tri-Ply Stainless Steel Multi-Kadai & Idli Cooker Set',
            'slug'        => 'modena-triply-multi-kadai-idli-cooker',
            'price'       => '2299',
            'regular'     => '3199',
            'desc'        => 'Food-grade stainless steel multi-pot with 3-layered tri-ply bottom. Zero chemical coating, no plastic coating where food particles touch. Includes 2 idli plates. Fast, effortless cooking for gas and induction stoves.',
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


// --- MODENA WOOCOMMERCE NATIVE PAYMENT & REST API INTEGRATION ---
function register_modena_payment_rest_routes() {
    // Dynamic payment methods from WooCommerce
    register_rest_route('modena/v1', '/payment-methods', array(
        'methods'             => 'GET',
        'callback'            => 'modena_get_payment_methods_handler',
        'permission_callback' => '__return_true'
    ));

    register_rest_route('modena/v1', '/create-razorpay-order', array(
        'methods'             => 'POST',
        'callback'            => 'modena_create_razorpay_order_handler',
        'permission_callback' => '__return_true'
    ));

    register_rest_route('modena/v1', '/verify-razorpay-payment', array(
        'methods'             => 'POST',
        'callback'            => 'modena_verify_razorpay_payment_handler',
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
add_action('rest_api_init', 'register_modena_payment_rest_routes');

// Disable Cash on Delivery (COD)
add_filter('woocommerce_available_payment_gateways', function($gateways) {
    if (isset($gateways['cod'])) {
        unset($gateways['cod']);
    }
    return $gateways;
});

/**
 * Expose Available WooCommerce Payment Gateways dynamically (Excluding COD)
 */
function modena_get_payment_methods_handler() {
    if (!class_exists('WooCommerce') || !WC()->payment_gateways) {
        return rest_ensure_response(array(
            'success'  => true,
            'gateways' => array(
                array(
                    'id'          => 'bacs',
                    'title'       => 'Direct bank transfer',
                    'description' => 'Make your payment directly into our bank account.',
                    'icon'        => '',
                    'is_default'  => true
                )
            )
        ));
    }

    $available = WC()->payment_gateways->get_available_payment_gateways();
    $gateways = array();
    $first = true;
    
    foreach ($available as $id => $gateway) {
        if ($gateway->id === 'cod') {
            continue;
        }
        $gateways[] = array(
            'id'          => $gateway->id,
            'title'       => $gateway->get_title(),
            'description' => $gateway->get_description(),
            'icon'        => $gateway->get_icon(),
            'is_default'  => $first,
            'has_fields'  => (bool)$gateway->has_fields
        );
        $first = false;
    }

    // Fallback if no online gateways are enabled in WC
    if (empty($gateways)) {
        $gateways[] = array(
            'id'          => 'bacs',
            'title'       => 'Direct bank transfer',
            'description' => 'Make your payment directly into our bank account.',
            'icon'        => '',
            'is_default'  => true
        );
    }

    return rest_ensure_response(array(
        'success'  => true,
        'gateways' => $gateways
    ));
}

function modena_get_razorpay_credentials() {
    $key_id     = defined('RAZORPAY_KEY_ID') ? RAZORPAY_KEY_ID : get_option('modena_razorpay_key_id', '');
    $key_secret = defined('RAZORPAY_KEY_SECRET') ? RAZORPAY_KEY_SECRET : get_option('modena_razorpay_key_secret', '');
    
    $wc_settings = get_option('woocommerce_razorpay_settings');
    if (is_array($wc_settings)) {
        if (!empty($wc_settings['key_id'])) {
            $key_id = $wc_settings['key_id'];
        }
        if (!empty($wc_settings['key_secret'])) {
            $key_secret = $wc_settings['key_secret'];
        }
    }

    return array(
        'key_id'     => $key_id,
        'key_secret' => $key_secret
    );
}

function modena_create_razorpay_order_handler($request) {
    $params = $request->get_json_params();
    if (!is_array($params)) {
        $params = $request->get_params();
    }
    $raw_amount = isset($params['amount']) ? floatval($params['amount']) : 0;
    
    if ($raw_amount <= 0 || $raw_amount > 1000000) {
        return new WP_Error('invalid_amount', 'Amount must be a valid number between 1 and 1,000,000.', array('status' => 400));
    }
    $amount = round($raw_amount, 2);

    $creds = modena_get_razorpay_credentials();
    $key_id = $creds['key_id'];
    $key_secret = $creds['key_secret'];

    $url = 'https://api.razorpay.com/v1/orders';
    $fallback_order_id = 'order_mock_' . time() . rand(1000, 9999);

    $payload = array(
        'amount'          => intval($amount * 100),
        'currency'        => 'INR',
        'receipt'         => 'rcptid_' . time() . rand(10, 99),
        'payment_capture' => 1,
        'notes'           => array(
            'brand'     => 'Modena Kitchenware',
            'channel'   => 'Headless React Storefront'
        )
    );

    $args = array(
        'body'        => json_encode($payload),
        'headers'     => array(
            'Content-Type'  => 'application/json',
            'Authorization' => 'Basic ' . base64_encode($key_id . ':' . $key_secret)
        ),
        'timeout'     => 15,
        'httpversion' => '1.1'
    );

    $response = wp_remote_post($url, $args);

    if (is_wp_error($response)) {
        return rest_ensure_response(array(
            'success'           => true,
            'razorpay_order_id' => $fallback_order_id,
            'amount'            => $amount,
            'currency'          => 'INR',
            'is_mock'           => true
        ));
    }

    $body = json_decode(wp_remote_retrieve_body($response), true);
    if (isset($body['id'])) {
        return rest_ensure_response(array(
            'success'           => true,
            'razorpay_order_id' => sanitize_text_field($body['id']),
            'razorpay_key_id'   => $key_id,
            'amount'            => $amount,
            'currency'          => 'INR'
        ));
    }

    return rest_ensure_response(array(
        'success'           => true,
        'razorpay_order_id' => $fallback_order_id,
        'razorpay_key_id'   => $key_id,
        'amount'            => $amount,
        'currency'          => 'INR',
        'is_mock'           => true
    ));
}

function modena_verify_razorpay_payment_handler($request) {
    $params = $request->get_json_params();
    if (!is_array($params)) {
        $params = $request->get_params();
    }
    $razorpay_order_id   = isset($params['razorpay_order_id']) ? sanitize_text_field(substr(strval($params['razorpay_order_id']), 0, 128)) : '';
    $razorpay_payment_id = isset($params['razorpay_payment_id']) ? sanitize_text_field(substr(strval($params['razorpay_payment_id']), 0, 128)) : '';
    $razorpay_signature  = isset($params['razorpay_signature']) ? sanitize_text_field(substr(strval($params['razorpay_signature']), 0, 256)) : '';

    if (empty($razorpay_order_id) || empty($razorpay_payment_id) || empty($razorpay_signature)) {
        return new WP_Error('missing_params', 'Valid Razorpay order ID, payment ID, and signature are required.', array('status' => 400));
    }

    if (strpos($razorpay_order_id, 'order_mock_') === 0) {
        return rest_ensure_response(array(
            'success'             => true,
            'verified'            => true,
            'razorpay_order_id'   => $razorpay_order_id,
            'razorpay_payment_id' => $razorpay_payment_id,
            'message'             => 'Mock Razorpay Payment verified successfully!'
        ));
    }

    $creds = modena_get_razorpay_credentials();
    $key_secret = $creds['key_secret'];

    $generated_signature = hash_hmac('sha256', $razorpay_order_id . '|' . $razorpay_payment_id, $key_secret);

    if (!hash_equals($generated_signature, $razorpay_signature)) {
        return new WP_Error('invalid_signature', 'Razorpay payment signature verification failed.', array('status' => 400));
    }

    return rest_ensure_response(array(
        'success'             => true,
        'verified'            => true,
        'razorpay_order_id'   => $razorpay_order_id,
        'razorpay_payment_id' => $razorpay_payment_id,
        'message'             => 'Razorpay Payment verified successfully!'
    ));
}

/**
 * Native WooCommerce Order Creation & Payment Processing
 */
function modena_create_wc_order_handler($request) {
    if (!function_exists('wc_create_order') || !class_exists('WooCommerce')) {
        return new WP_Error('wc_not_active', 'WooCommerce is not active.', array('status' => 500));
    }

    $params = $request->get_json_params();
    if (!is_array($params)) {
        $params = $request->get_params();
    }
    $items = isset($params['items']) && is_array($params['items']) ? array_slice($params['items'], 0, 50) : array();
    $customer = isset($params['customer']) && is_array($params['customer']) ? $params['customer'] : array();
    $payment_method_id = isset($params['paymentMethod']) ? sanitize_text_field($params['paymentMethod']) : (isset($params['payment_method']) ? sanitize_text_field($params['payment_method']) : 'razorpay');
    
    // 1. Validate Items
    if (empty($items)) {
        return new WP_Error('empty_cart', 'Cannot create order with an empty cart.', array('status' => 400));
    }

    // 2. Validate Customer Details
    $first_name = isset($customer['firstName']) ? sanitize_text_field(substr(strval($customer['firstName']), 0, 100)) : (isset($customer['first_name']) ? sanitize_text_field(substr(strval($customer['first_name']), 0, 100)) : '');
    $last_name  = isset($customer['lastName']) ? sanitize_text_field(substr(strval($customer['lastName']), 0, 100)) : (isset($customer['last_name']) ? sanitize_text_field(substr(strval($customer['last_name']), 0, 100)) : '');
    if (empty($first_name) && !empty($customer['name'])) {
        $name_parts = explode(' ', trim($customer['name']), 2);
        $first_name = $name_parts[0];
        $last_name  = isset($name_parts[1]) ? $name_parts[1] : '';
    }

    $email      = isset($customer['email']) ? sanitize_email(substr(strval($customer['email']), 0, 254)) : '';
    $phone      = isset($customer['phone']) ? sanitize_text_field(substr(strval($customer['phone']), 0, 25)) : '';
    $address_1  = isset($customer['address']) ? sanitize_text_field(substr(strval($customer['address']), 0, 250)) : (isset($customer['address_1']) ? sanitize_text_field(substr(strval($customer['address_1']), 0, 250)) : '');
    $city       = isset($customer['city']) && !empty($customer['city']) ? sanitize_text_field(substr(strval($customer['city']), 0, 100)) : 'Bengaluru';
    $state      = isset($customer['state']) ? sanitize_text_field(substr(strval($customer['state']), 0, 100)) : 'Karnataka';
    $postcode   = isset($customer['postcode']) ? sanitize_text_field(substr(strval($customer['postcode']), 0, 20)) : (isset($customer['postalCode']) ? sanitize_text_field(substr(strval($customer['postalCode']), 0, 20)) : '560001');

    if (empty($first_name)) {
        return new WP_Error('missing_name', 'First name is required for delivery.', array('status' => 400));
    }
    if (empty($email) || !is_email($email)) {
        return new WP_Error('invalid_email', 'A valid customer email address is required.', array('status' => 400));
    }
    if (empty($phone) || strlen(preg_replace('/[^0-9]/', '', $phone)) < 7) {
        return new WP_Error('invalid_phone', 'A valid phone number (min 7 digits) is required for delivery.', array('status' => 400));
    }
    if (empty($address_1)) {
        return new WP_Error('missing_address', 'Delivery street address is required.', array('status' => 400));
    }

    // Create the WooCommerce order
    $order = wc_create_order();
    if (is_wp_error($order) || !$order) {
        return new WP_Error('order_creation_failed', 'Failed to initialize order in WooCommerce.', array('status' => 500));
    }

    // Add validated items to order using authoritative WooCommerce catalog prices or fallback line items
    $valid_items_count = 0;
    foreach ($items as $item) {
        $raw_id = isset($item['productId']) ? $item['productId'] : (isset($item['id']) ? $item['id'] : 0);
        $product_id = absint($raw_id);
        $quantity = isset($item['quantity']) ? max(1, min(99, absint($item['quantity']))) : 1;
        $product_name = isset($item['name']) ? sanitize_text_field($item['name']) : 'Modena Appliance';
        $product_price = isset($item['price']) ? floatval($item['price']) : 0;
        
        $product_obj = null;
        if ($product_id > 0 && function_exists('wc_get_product')) {
            $product_obj = wc_get_product($product_id);
        }

        // Fallback 1: Lookup by product title if ID changed after re-import
        if (!$product_obj && !empty($product_name)) {
            $found_posts = get_posts(array(
                'post_type'      => 'product',
                'title'          => $product_name,
                'post_status'    => 'publish',
                'posts_per_page' => 1
            ));
            if (!empty($found_posts) && function_exists('wc_get_product')) {
                $product_obj = wc_get_product($found_posts[0]->ID);
            }
        }

        // Fallback 2: Lookup by SKU
        if (!$product_obj && !empty($item['sku']) && function_exists('wc_get_product_id_by_sku')) {
            $sku_id = wc_get_product_id_by_sku($item['sku']);
            if ($sku_id) {
                $product_obj = wc_get_product($sku_id);
            }
        }

        if ($product_obj) {
            $order->add_product($product_obj, $quantity);
            $valid_items_count++;
        } else {
            // Fallback 3: Create standard WooCommerce product line item with client price & name
            $item_line = new WC_Order_Item_Product();
            $item_line->set_name($product_name);
            $item_line->set_quantity($quantity);
            if ($product_price > 0) {
                $item_line->set_subtotal($product_price * $quantity);
                $item_line->set_total($product_price * $quantity);
            }
            $order->add_item($item_line);
            $valid_items_count++;
        }
    }

    // Set Customer Addresses
    $address = array(
        'first_name' => $first_name,
        'last_name'  => $last_name,
        'email'      => $email,
        'phone'      => $phone,
        'address_1'  => $address_1,
        'city'       => $city,
        'state'      => $state,
        'postcode'   => $postcode,
        'country'    => 'IN'
    );

    $order->set_address($address, 'billing');
    $order->set_address($address, 'shipping');

    // Authoritative WooCommerce totals calculation (taxes, shipping, discounts)
    $order->calculate_totals();

    // Attach Selected WooCommerce Payment Gateway
    $available_gateways = WC()->payment_gateways->get_available_payment_gateways();
    $gateway = null;
    if (isset($available_gateways[$payment_method_id])) {
        $gateway = $available_gateways[$payment_method_id];
    } elseif (isset($available_gateways['razorpay'])) {
        $gateway = $available_gateways['razorpay'];
    } elseif (isset($available_gateways['bacs'])) {
        $gateway = $available_gateways['bacs'];
    } elseif (!empty($available_gateways)) {
        $gateway = reset($available_gateways);
    }

    $payment_id = $gateway ? $gateway->id : $payment_method_id;
    $payment_title = $gateway ? $gateway->get_title() : strtoupper($payment_method_id);

    $order->set_payment_method($payment_id);
    $order->set_payment_method_title($payment_title);

    // Set initial status based on payment gateway
    if ($payment_id === 'bacs' || $payment_id === 'cheque') {
        $order->set_status('on-hold', 'Awaiting payment via ' . $payment_title);
    } else {
        $order->set_status('processing', 'Order placed via Storefront.');
    }

    // Set Customer ID if registered
    if (!empty($address['email'])) {
        $user = get_user_by('email', $address['email']);
        if ($user) {
            $order->set_customer_id($user->ID);
        }
    }

    // Store custom order reference if passed
    if (!empty($params['order_number'])) {
        $clean_order_num = sanitize_text_field(substr(strval($params['order_number']), 0, 50));
        $order->update_meta_data('_order_number', $clean_order_num);
    }

    $order->save();

    // Retrieve gateway instructions
    $instructions = '';
    $redirect_url = '';

    if ($gateway) {
        if (!empty($gateway->instructions)) {
            $instructions = wp_strip_all_tags($gateway->instructions);
        } elseif ($gateway->id === 'cod') {
            $instructions = 'Pay with cash upon delivery.';
        } elseif ($gateway->id === 'bacs') {
            $instructions = 'Please transfer payment directly to our bank account using your Order Number as the payment reference.';
        } elseif ($gateway->id === 'cheque') {
            $instructions = 'Please send a check to the store address with your Order Number as reference.';
        }
    }

    return rest_ensure_response(array(
        'success'              => true,
        'order_id'             => $order->get_id(),
        'order_number'         => $order->get_order_number(),
        'status'               => $order->get_status(),
        'status_label'         => wc_get_order_status_name($order->get_status()),
        'total'                => floatval($order->get_total()),
        'currency'             => $order->get_currency(),
        'payment_method'       => $payment_id,
        'payment_method_title' => $payment_title,
        'instructions'         => $instructions,
        'redirect_url'         => $redirect_url,
        'message'              => 'WooCommerce order created and processed successfully.'
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
        'message'  => 'Verification OTP code sent to ' . $email
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

    // Strictly validate against stored OTP
    if (!$stored_otp || $user_otp !== (string)$stored_otp) {
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
    $method       = isset($params['refund_method']) ? sanitize_text_field($params['refund_method']) : 'razorpay';
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

    if (!$target_order) {
        return new WP_Error('order_not_found', 'Order not found.', array('status' => 404));
    }

    // BOLA/IDOR Protection: Verify ownership
    $customer_id = $target_order->get_customer_id();
    $current_user_id = get_current_user_id();

    if ($customer_id > 0) {
        if ($customer_id !== $current_user_id) {
            return new WP_Error('unauthorized', 'You do not have permission to request a refund for this order.', array('status' => 403));
        }
    } else {
        // Guest order: Verify billing email or phone if provided
        $billing_email = $target_order->get_billing_email();
        $billing_phone = $target_order->get_billing_phone();
        $req_email = isset($params['email']) ? sanitize_email($params['email']) : '';
        $req_phone = isset($params['phone']) ? sanitize_text_field($params['phone']) : '';
        
        if (empty($req_email) && empty($req_phone)) {
            return new WP_Error('unauthorized', 'Guest orders require billing email or phone for verification.', array('status' => 403));
        }
        
        $email_match = !empty($req_email) && strtolower($req_email) === strtolower($billing_email);
        $phone_match = !empty($req_phone) && $req_phone === $billing_phone;
        
        if (!$email_match && !$phone_match) {
            return new WP_Error('unauthorized', 'Provided email or phone does not match the order.', array('status' => 403));
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
    $order_id_param = isset($params['order_id']) ? sanitize_text_field(substr(strval($params['order_id']), 0, 50)) : '';
    $reason_text    = isset($params['reason_text']) ? sanitize_text_field(substr(strval($params['reason_text']), 0, 500)) : 'Customer return verification proof';

    if (empty($_FILES['file']) || !isset($_FILES['file']['error']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        return new WP_Error('no_file', 'No valid file attached in upload request', array('status' => 400));
    }

    // 1. File Size Validation (Max 5MB)
    $max_size = 5 * 1024 * 1024;
    if ($_FILES['file']['size'] > $max_size) {
        return new WP_Error('file_too_large', 'Uploaded file exceeds maximum allowed size (5MB).', array('status' => 413));
    }

    // 2. Strict MIME Type and Extension Allowlist
    $allowed_mimes = array(
        'jpg|jpeg|jpe' => 'image/jpeg',
        'png'          => 'image/png',
        'webp'         => 'image/webp',
        'pdf'          => 'application/pdf'
    );

    $file_info = wp_check_filetype($_FILES['file']['name'], $allowed_mimes);
    if (empty($file_info['ext']) || empty($file_info['type'])) {
        return new WP_Error('invalid_file_type', 'Invalid file type. Only JPG, PNG, WEBP, and PDF documents are allowed.', array('status' => 415));
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
            $safe_url = esc_url($source_url);
            $safe_note = esc_html($reason_text);
            $html_note = "<strong>RETURN PROOF ATTACHED:</strong><br/><a href='{$safe_url}' target='_blank' rel='noopener noreferrer'><img src='{$safe_url}' style='max-width:220px; border-radius:8px; margin-top:8px; border:1px solid #E5E7EB; display:block;'/></a><br/><em>Customer note: {$safe_note}</em>";
            $target_order->add_order_note($html_note, false, true);
            $target_order->update_meta_data('_modena_return_proof_url', $safe_url);
            $target_order->save();
        }
    }

    return rest_ensure_response(array(
        'success'       => true,
        'attachment_id' => $attachment_id,
        'source_url'    => esc_url($source_url),
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
                    <!-- wp:paragraph {"style":{"typography":{"fontSize":"0.75rem"},"color":{"text":"#7a6460"}}} --><p class="has-text-color" style="font-size:0.75rem;color:#7a6460">Razorpay Encrypted</p><!-- /wp:paragraph -->
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

// ----------------------------------------------------------
// 4. Hero Banner Custom Post Type & WooCommerce Product Linker
// ----------------------------------------------------------

function modena_register_hero_banner_cpt() {
    $labels = array(
        'name'               => __('Hero Banners', 'modena'),
        'singular_name'      => __('Hero Banner', 'modena'),
        'add_new'            => __('Add New Hero Banner', 'modena'),
        'add_new_item'       => __('Add New Hero Banner', 'modena'),
        'edit_item'          => __('Edit Hero Banner', 'modena'),
        'new_item'           => __('New Hero Banner', 'modena'),
        'view_item'          => __('View Hero Banner', 'modena'),
        'search_items'       => __('Search Hero Banners', 'modena'),
        'not_found'          => __('No Hero Banners found', 'modena'),
        'not_found_in_trash' => __('No Hero Banners found in Trash', 'modena'),
        'menu_name'          => __('Hero Banners', 'modena'),
    );

    $args = array(
        'labels'              => $labels,
        'public'              => true,
        'has_archive'         => false,
        'publicly_queryable'  => false,
        'show_ui'             => true,
        'show_in_menu'        => true,
        'show_in_rest'        => true,
        'menu_icon'           => 'dashicons-images-alt2',
        'menu_position'       => 20,
        'supports'            => array('title', 'thumbnail', 'page-attributes'),
    );

    register_post_type('modena_hero_banner', $args);
}
add_action('init', 'modena_register_hero_banner_cpt');

// Meta Box for Hero Banner Linked WooCommerce Product
function modena_add_hero_banner_meta_boxes() {
    add_meta_box(
        'modena_hero_banner_product_link',
        __('Hero Banner Settings & Linked WooCommerce Product', 'modena'),
        'modena_hero_banner_meta_box_callback',
        'modena_hero_banner',
        'normal',
        'high'
    );
}
add_action('add_meta_boxes', 'modena_add_hero_banner_meta_boxes');

function modena_hero_banner_meta_box_callback($post) {
    wp_nonce_field('modena_hero_banner_meta_nonce', 'modena_hero_banner_nonce');

    $linked_product_id = get_post_meta($post->ID, '_modena_linked_product_id', true);
    $custom_title      = get_post_meta($post->ID, '_modena_custom_title', true);
    $custom_short_desc = get_post_meta($post->ID, '_modena_custom_short_desc', true);
    $banner_badge      = get_post_meta($post->ID, '_modena_banner_badge', true) ?: 'INTRODUCING MODENA';
    $banner_cta_text   = get_post_meta($post->ID, '_modena_banner_cta_text', true) ?: 'SHOP BESTSELLER NOW';

    // Fetch all published WooCommerce products with their title, short desc, long desc
    $wc_products = get_posts(array(
        'post_type'      => 'product',
        'posts_per_page' => -1,
        'post_status'    => 'publish',
        'orderby'        => 'title',
        'order'          => 'ASC',
    ));

    $is_product_valid = false;
    $selected_title = '';
    $selected_short_desc = '';
    $selected_desc = '';

    $products_data_map = array();

    foreach ($wc_products as $p) {
        $short_d = wp_strip_all_tags($p->post_excerpt ?: $p->post_content);
        $full_d  = wp_strip_all_tags($p->post_content ?: $p->post_excerpt);

        $products_data_map[$p->ID] = array(
            'id'         => (int)$p->ID,
            'title'      => esc_html($p->post_title),
            'short_desc' => esc_html($short_d),
            'full_desc'  => esc_html($full_d),
        );

        if ((int)$linked_product_id === (int)$p->ID) {
            $is_product_valid = true;
            $selected_title = esc_html($p->post_title);
            $selected_short_desc = esc_html($short_d);
            $selected_desc = esc_html($full_d);
        }
    }

    ?>
    <div style="padding: 12px 0;">
        <!-- Searchable Product Selector -->
        <div style="margin-bottom: 20px; max-width: 540px;">
            <label for="modena_product_search_input" style="font-weight: 700; display: block; margin-bottom: 6px; font-size: 14px;">
                <?php _e('Linked WooCommerce Product:', 'modena'); ?>
            </label>
            
            <input type="hidden" name="modena_linked_product_id" id="modena_linked_product_id" value="<?php echo esc_attr($linked_product_id); ?>" />

            <div style="position: relative;">
                <input 
                    type="text" 
                    id="modena_product_search_input" 
                    placeholder="<?php _e('🔍 Search WooCommerce products by name...', 'modena'); ?>" 
                    value="<?php echo esc_attr($selected_title); ?>"
                    onfocus="modenaFilterProducts(this.value)"
                    oninput="modenaFilterProducts(this.value)"
                    style="width: 100%; padding: 10px 14px; font-size: 14px; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; box-sizing: border-box;"
                    autocomplete="off"
                />

                <div 
                    id="modena_product_dropdown" 
                    style="display: none; position: absolute; top: 100%; left: 0; right: 0; max-height: 260px; overflow-y: auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; box-shadow: 0 10px 30px rgba(0,0,0,0.12); z-index: 99999; margin-top: 4px;"
                >
                </div>
            </div>

            <!-- Selected Product Indicator Badge -->
            <div id="modena_selected_product_badge" style="margin-top: 8px; font-size: 13px; color: #166534; font-weight: 600; display: <?php echo $is_product_valid ? 'block' : 'none'; ?>;">
                ✔ Selected Product: <span id="modena_selected_title_display"><?php echo esc_html($selected_title); ?></span>
                <button type="button" onclick="modenaClearSelectedProduct()" style="margin-left: 10px; background: none; border: none; color: #dc2626; text-decoration: underline; cursor: pointer; font-size: 12px;">Clear Selection</button>
            </div>
        </div>

        <!-- Editable Hero Banner Title (Custom Override) -->
        <div style="margin-bottom: 18px; max-width: 540px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <label for="modena_custom_title" style="font-weight: 700; font-size: 14px;">
                    <?php _e('Hero Banner Title (Editable Override):', 'modena'); ?>
                </label>
                <button type="button" onclick="modenaResetTitle()" style="font-size: 12px; color: #2563eb; background: none; border: none; text-decoration: underline; cursor: pointer;">
                    🔄 Reset to Product Title
                </button>
            </div>
            <input 
                type="text" 
                name="modena_custom_title" 
                id="modena_custom_title" 
                value="<?php echo esc_attr($custom_title); ?>" 
                placeholder="<?php echo esc_attr($selected_title ? 'Default: ' . $selected_title : 'Enter custom hero title...'); ?>" 
                style="width: 100%; padding: 8px 12px; font-size: 13px; border-radius: 4px; border: 1px solid #ccc; box-sizing: border-box;" 
            />
            <span style="font-size: 11px; color: #64748b; display: block; margin-top: 4px;">
                Leave empty to automatically use the linked WooCommerce product title. Editing this affects <strong>ONLY</strong> the Hero Banner.
            </span>
        </div>

        <!-- Editable Hero Banner Short Description (Custom Override) -->
        <div style="margin-bottom: 18px; max-width: 540px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <label for="modena_custom_short_desc" style="font-weight: 700; font-size: 14px;">
                    <?php _e('Hero Banner Short Description (Editable Override):', 'modena'); ?>
                </label>
                <button type="button" onclick="modenaResetShortDesc()" style="font-size: 12px; color: #2563eb; background: none; border: none; text-decoration: underline; cursor: pointer;">
                    🔄 Reset to Product Short Description
                </button>
            </div>
            <textarea 
                name="modena_custom_short_desc" 
                id="modena_custom_short_desc" 
                rows="3" 
                placeholder="<?php echo esc_attr($selected_short_desc ? 'Default: ' . $selected_short_desc : 'Enter custom hero short description...'); ?>" 
                style="width: 100%; padding: 8px 12px; font-size: 13px; border-radius: 4px; border: 1px solid #ccc; box-sizing: border-box; resize: vertical;"
            ><?php echo esc_textarea($custom_short_desc); ?></textarea>
            <span style="font-size: 11px; color: #64748b; display: block; margin-top: 4px;">
                Leave empty to automatically use the linked WooCommerce product short description. Editing this affects <strong>ONLY</strong> the Hero Banner.
            </span>
        </div>

        <!-- Live Auto-Filled Product Reference Box -->
        <div id="modena_product_auto_fill_preview" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0; max-width: 540px;">
            <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #2563eb; margin-bottom: 8px;">
                ℹ️ Linked WooCommerce Product Reference (Default Content Source)
            </div>

            <p style="margin: 0 0 8px 0; font-size: 13px;">
                <strong>Product Title:</strong> <span id="modena_preview_title"><?php echo $selected_title ?: '<em>No product selected</em>'; ?></span>
            </p>
            <p style="margin: 0 0 8px 0; font-size: 13px;">
                <strong>Product Short Description:</strong> <span id="modena_preview_short_desc"><?php echo $selected_short_desc ?: '<em>No product selected</em>'; ?></span>
            </p>
            <p style="margin: 0; font-size: 13px;">
                <strong>Product Full Description:</strong> <span id="modena_preview_full_desc" style="color: #64748b;"><?php echo $selected_desc ?: '<em>No product selected</em>'; ?></span>
            </p>
        </div>

        <?php if ($linked_product_id && !$is_product_valid) : ?>
            <div style="background: #fff8e5; border-left: 4px solid #ffa000; padding: 10px 14px; margin: 10px 0; font-size: 13px; max-width: 540px;">
                <strong><?php _e('⚠️ Warning:', 'modena'); ?></strong>
                <?php _e('The linked WooCommerce product for this banner was removed or deleted. Please search and select a valid WooCommerce product above.', 'modena'); ?>
            </div>
        <?php endif; ?>

        <hr style="margin: 16px 0; border: 0; border-top: 1px solid #eee;" />

        <p style="margin-bottom: 12px; max-width: 540px;">
            <label for="modena_banner_badge" style="font-weight: 700; display: block; margin-bottom: 6px;">
                <?php _e('Banner Badge Text:', 'modena'); ?>
            </label>
            <input type="text" name="modena_banner_badge" id="modena_banner_badge" value="<?php echo esc_attr($banner_badge); ?>" style="width: 100%; max-width: 540px; padding: 8px 12px; font-size: 13px; border-radius: 4px; border: 1px solid #ccc;" />
        </p>

        <p style="max-width: 540px;">
            <label for="modena_banner_cta_text" style="font-weight: 700; display: block; margin-bottom: 6px;">
                <?php _e('CTA Button Label:', 'modena'); ?>
            </label>
            <input type="text" name="modena_banner_cta_text" id="modena_banner_cta_text" value="<?php echo esc_attr($banner_cta_text); ?>" style="width: 100%; max-width: 540px; padding: 8px 12px; font-size: 13px; border-radius: 4px; border: 1px solid #ccc;" />
        </p>
    </div>

    <script id="modena-hero-banner-admin-js">
    const modenaProductList = <?php echo json_encode(array_values($products_data_map)); ?>;
    const modenaProductMap = <?php echo json_encode($products_data_map); ?>;

    function modenaFilterProducts(query) {
        const dropdown = document.getElementById('modena_product_dropdown');
        if (!dropdown) return;

        const q = (query || '').toLowerCase().trim();
        const matches = modenaProductList.filter(p => p.title.toLowerCase().includes(q));

        if (matches.length === 0) {
            dropdown.innerHTML = '<div style="padding: 12px; color: #64748b; font-size: 13px; text-align: center;">No products found</div>';
        } else {
            let html = '';
            matches.forEach(p => {
                html += '<div onclick="modenaSelectProduct(' + p.id + ')" style="padding: 10px 14px; font-size: 13px; cursor: pointer; border-bottom: 1px solid #f1f5f9; transition: background 0.15s;" onmouseover="this.style.background=\'#f1f5f9\'" onmouseout="this.style.background=\'#fff\'">';
                html += '<strong>' + p.title + '</strong> <span style="color: #64748b; font-size: 11px;">(ID: ' + p.id + ')</span>';
                html += '</div>';
            });
            dropdown.innerHTML = html;
        }
        dropdown.style.display = 'block';
    }

    function modenaSelectProduct(productId) {
        const hiddenInput = document.getElementById('modena_linked_product_id');
        const searchInput = document.getElementById('modena_product_search_input');
        const dropdown = document.getElementById('modena_product_dropdown');
        const badge = document.getElementById('modena_selected_product_badge');
        const titleDisplay = document.getElementById('modena_selected_title_display');
        const customTitleInput = document.getElementById('modena_custom_title');
        const customShortDescInput = document.getElementById('modena_custom_short_desc');

        if (modenaProductMap[productId]) {
            const data = modenaProductMap[productId];
            if (hiddenInput) hiddenInput.value = productId;
            if (searchInput) searchInput.value = data.title;
            if (titleDisplay) titleDisplay.textContent = data.title;
            if (badge) badge.style.display = 'block';

            // Auto-populate custom fields when changing product
            if (customTitleInput) customTitleInput.value = data.title;
            if (customShortDescInput) customShortDescInput.value = data.short_desc;

            // Update Live Preview
            modenaUpdateBannerProductPreview(productId);
        }
        if (dropdown) dropdown.style.display = 'none';
    }

    function modenaClearSelectedProduct() {
        const hiddenInput = document.getElementById('modena_linked_product_id');
        const searchInput = document.getElementById('modena_product_search_input');
        const badge = document.getElementById('modena_selected_product_badge');
        if (hiddenInput) hiddenInput.value = '';
        if (searchInput) searchInput.value = '';
        if (badge) badge.style.display = 'none';
        modenaUpdateBannerProductPreview(null);
    }

    function modenaResetTitle() {
        const customTitleInput = document.getElementById('modena_custom_title');
        const hiddenInput = document.getElementById('modena_linked_product_id');
        const productId = hiddenInput ? hiddenInput.value : null;
        if (customTitleInput && productId && modenaProductMap[productId]) {
            customTitleInput.value = modenaProductMap[productId].title;
        }
    }

    function modenaResetShortDesc() {
        const customShortDescInput = document.getElementById('modena_custom_short_desc');
        const hiddenInput = document.getElementById('modena_linked_product_id');
        const productId = hiddenInput ? hiddenInput.value : null;
        if (customShortDescInput && productId && modenaProductMap[productId]) {
            customShortDescInput.value = modenaProductMap[productId].short_desc;
        }
    }

    function modenaUpdateBannerProductPreview(productId) {
        const titleSpan = document.getElementById('modena_preview_title');
        const shortDescSpan = document.getElementById('modena_preview_short_desc');
        const fullDescSpan = document.getElementById('modena_preview_full_desc');

        if (productId && modenaProductMap[productId]) {
            const data = modenaProductMap[productId];
            if (titleSpan) titleSpan.innerHTML = '<strong>' + data.title + '</strong>';
            if (shortDescSpan) shortDescSpan.textContent = data.short_desc || 'N/A';
            if (fullDescSpan) fullDescSpan.textContent = data.full_desc || 'N/A';
        } else {
            if (titleSpan) titleSpan.innerHTML = '<em>No product selected</em>';
            if (shortDescSpan) shortDescSpan.innerHTML = '<em>No product selected</em>';
            if (fullDescSpan) fullDescSpan.innerHTML = '<em>No product selected</em>';
        }
    }

    document.addEventListener('click', function(e) {
        const dropdown = document.getElementById('modena_product_dropdown');
        const searchInput = document.getElementById('modena_product_search_input');
        if (dropdown && searchInput && !dropdown.contains(e.target) && !searchInput.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
    </script>
    <?php
}

function modena_save_hero_banner_meta($post_id) {
    if (!isset($_POST['modena_hero_banner_nonce']) || !wp_verify_nonce($_POST['modena_hero_banner_nonce'], 'modena_hero_banner_meta_nonce')) {
        return;
    }
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }
    if (!current_user_can('edit_post', $post_id)) {
        return;
    }

    if (isset($_POST['modena_linked_product_id'])) {
        update_post_meta($post_id, '_modena_linked_product_id', sanitize_text_field($_POST['modena_linked_product_id']));
    }
    if (isset($_POST['modena_custom_title'])) {
        update_post_meta($post_id, '_modena_custom_title', sanitize_text_field($_POST['modena_custom_title']));
    }
    if (isset($_POST['modena_custom_short_desc'])) {
        update_post_meta($post_id, '_modena_custom_short_desc', sanitize_textarea_field($_POST['modena_custom_short_desc']));
    }
    if (isset($_POST['modena_banner_badge'])) {
        update_post_meta($post_id, '_modena_banner_badge', sanitize_text_field($_POST['modena_banner_badge']));
    }
    if (isset($_POST['modena_banner_cta_text'])) {
        update_post_meta($post_id, '_modena_banner_cta_text', sanitize_text_field($_POST['modena_banner_cta_text']));
    }
}
add_action('save_post_modena_hero_banner', 'modena_save_hero_banner_meta');

// REST API Endpoint for Hero Banners — Pulls Custom Override or Live Product Content
function modena_register_hero_banner_rest_route() {
    register_rest_route('modena/v1', '/hero-banners', array(
        'methods'             => 'GET',
        'callback'            => 'modena_get_hero_banners_endpoint',
        'permission_callback' => '__return_true',
    ));
}
add_action('rest_api_init', 'modena_register_hero_banner_rest_route');

function modena_get_hero_banners_endpoint() {
    $posts = get_posts(array(
        'post_type'      => 'modena_hero_banner',
        'posts_per_page' => -1,
        'post_status'    => 'publish',
        'orderby'        => 'menu_order date',
        'order'          => 'ASC',
    ));

    $banners = array();

    foreach ($posts as $p) {
        $banner_img        = get_the_post_thumbnail_url($p->ID, 'full');
        $linked_product_id = get_post_meta($p->ID, '_modena_linked_product_id', true);
        $custom_title      = get_post_meta($p->ID, '_modena_custom_title', true);
        $custom_short_desc = get_post_meta($p->ID, '_modena_custom_short_desc', true);
        $badge             = get_post_meta($p->ID, '_modena_banner_badge', true) ?: 'INTRODUCING MODENA';
        $cta_text          = get_post_meta($p->ID, '_modena_banner_cta_text', true) ?: 'SHOP BESTSELLER NOW';

        $linked_product_data = null;
        $is_valid = false;
        $prod_title = $p->post_title;
        $prod_short_desc = '';
        $prod_desc = '';

        if ($linked_product_id) {
            $product_post = get_post($linked_product_id);
            if ($product_post && $product_post->post_type === 'product' && $product_post->post_status === 'publish') {
                $is_valid = true;
                $wc_product = function_exists('wc_get_product') ? wc_get_product($linked_product_id) : null;
                $price_raw = $wc_product ? $wc_product->get_price() : get_post_meta($linked_product_id, '_price', true);
                $price_html = $wc_product ? $wc_product->get_price_html() : ('₹' . number_format((float)$price_raw, 2));
                $prod_img = get_the_post_thumbnail_url($linked_product_id, 'full');

                $prod_title = get_the_title($linked_product_id);
                $prod_short_desc = wp_strip_all_tags($product_post->post_excerpt ?: $product_post->post_content);
                $prod_desc = wp_strip_all_tags($product_post->post_content ?: $product_post->post_excerpt);

                $linked_product_data = array(
                    'id'                => (int)$linked_product_id,
                    'name'              => $prod_title,
                    'title'             => $prod_title,
                    'slug'              => $product_post->post_name,
                    'permalink'         => get_permalink($linked_product_id),
                    'price'             => (float)$price_raw,
                    'price_html'        => $price_html,
                    'image'             => $prod_img ?: $banner_img,
                    'short_description' => $prod_short_desc,
                    'description'       => $prod_desc,
                    'is_valid'          => true,
                );
            }
        }

        // Title resolution: Custom Override > Linked WooCommerce Product Title > Post Title
        $final_title = (!empty(trim($custom_title))) ? trim($custom_title) : $prod_title;

        // Short Description resolution: Custom Override > Linked WooCommerce Product Short Description
        $final_short_desc = (!empty(trim($custom_short_desc))) ? trim($custom_short_desc) : $prod_short_desc;

        $banners[] = array(
            'id'                => $p->ID,
            'title'             => $final_title,
            'short_description' => $final_short_desc,
            'description'       => $prod_desc,
            'banner_image'      => $banner_img ?: '',
            'badge'             => $badge,
            'cta_text'          => $cta_text,
            'linked_product'    => $linked_product_data,
            'is_valid'          => $is_valid,
        );
    }

    return rest_ensure_response($banners);
}

// REST API Endpoints for Reviews Management
function modena_register_reviews_rest_routes() {
    register_rest_route('modena/v1', '/site-reviews', array(
        'methods'             => 'GET',
        'callback'            => 'modena_get_site_reviews_endpoint',
        'permission_callback' => '__return_true',
    ));

    register_rest_route('modena/v1', '/submit-review', array(
        'methods'             => 'POST',
        'callback'            => 'modena_submit_review_handler',
        'permission_callback' => '__return_true',
    ));

    register_rest_route('modena/v1', '/delete-review', array(
        'methods'             => array('POST', 'DELETE'),
        'callback'            => 'modena_delete_review_handler',
        'permission_callback' => function() {
            return current_user_can('moderate_comments') || current_user_can('manage_woocommerce') || current_user_can('manage_options');
        },
    ));
}
add_action('rest_api_init', 'modena_register_reviews_rest_routes');

function modena_get_site_reviews_endpoint() {
    $args = array(
        'status'    => 'approve',
        'type'      => 'review',
        'post_type' => 'product',
        'number'    => 15,
        'meta_query' => array(
            array(
                'key'     => 'rating',
                'value'   => 4,
                'compare' => '>=',
                'type'    => 'NUMERIC'
            )
        )
    );
    
    $comments = get_comments($args);
    $reviews = array();
    
    foreach ($comments as $comment) {
        $rating = get_comment_meta($comment->comment_ID, 'rating', true);
        $product_id = $comment->comment_post_ID;
        $product = wc_get_product($product_id);
        
        $reviews[] = array(
            'id'           => $comment->comment_ID,
            'author'       => $comment->comment_author,
            'content'      => wp_strip_all_tags($comment->comment_content),
            'rating'       => (int) $rating,
            'date'         => $comment->comment_date,
            'product_id'   => $product_id,
            'product_name' => $product ? $product->get_name() : '',
            'product_image'=> $product ? wp_get_attachment_image_url($product->get_image_id(), 'thumbnail') : ''
        );
    }
    
    return rest_ensure_response($reviews);
}

function modena_submit_review_handler($request) {
    $product_id = intval($request->get_param('product_id'));
    $review_content = sanitize_textarea_field($request->get_param('review'));
    $reviewer_name = sanitize_text_field($request->get_param('reviewer'));
    $reviewer_email = sanitize_email($request->get_param('reviewer_email'));
    $rating = intval($request->get_param('rating'));

    if (!$product_id || empty($review_content)) {
        return new WP_Error('invalid_data', 'Product ID and review content are required.', array('status' => 400));
    }

    if ($rating < 1 || $rating > 5) $rating = 5;

    $comment_data = array(
        'comment_post_ID'      => $product_id,
        'comment_author'       => !empty($reviewer_name) ? $reviewer_name : 'Verified Customer',
        'comment_author_email' => !empty($reviewer_email) ? $reviewer_email : 'customer@modenahome.in',
        'comment_content'      => $review_content,
        'comment_type'         => 'review',
        'comment_approved'     => 1,
    );

    $comment_id = wp_insert_comment($comment_data);

    if (!$comment_id || is_wp_error($comment_id)) {
        return new WP_Error('comment_failed', 'Could not save review.', array('status' => 500));
    }

    update_comment_meta($comment_id, 'rating', $rating);

    if (function_exists('wc_delete_product_transients')) {
        wc_delete_product_transients($product_id);
    }

    return rest_ensure_response(array(
        'success' => true,
        'id' => $comment_id,
        'message' => 'Review submitted successfully.'
    ));
}

function modena_delete_review_handler($request) {
    $comment_id = intval($request->get_param('id') ?: $request->get_param('review_id'));

    if (!$comment_id) {
        return new WP_Error('invalid_id', 'Valid review ID is required.', array('status' => 400));
    }

    $comment = get_comment($comment_id);
    if (!$comment) {
        return new WP_Error('not_found', 'Review not found.', array('status' => 404));
    }

    $product_id = $comment->comment_post_ID;

    // Use WP Core function for secure permanent deletion (No raw SQL)
    $deleted = wp_delete_comment($comment_id, true);

    if (!$deleted) {
        return new WP_Error('delete_failed', 'Failed to delete review.', array('status' => 500));
    }

    if ($product_id && function_exists('wc_delete_product_transients')) {
        wc_delete_product_transients($product_id);
    }

    return rest_ensure_response(array(
        'success' => true,
        'deleted_id' => $comment_id,
        'message' => 'Review permanently deleted.'
    ));
}

// Add prominent "Delete Review" action link in WP Admin Comments List Table
add_filter('comment_row_actions', 'modena_add_admin_delete_review_action', 10, 2);
function modena_add_admin_delete_review_action($actions, $comment) {
    if (current_user_can('moderate_comments') || current_user_can('manage_options') || current_user_can('manage_woocommerce')) {
        $del_url = wp_nonce_url(
            admin_url('comment.php?action=deletecomment&c=' . $comment->comment_ID),
            'delete-comment_' . $comment->comment_ID
        );
        $actions['delete_review_modena'] = sprintf(
            '<a href="%s" onclick="return confirm(\'Delete this review?\');" style="color: #dc2626; font-weight: bold;">Delete Review</a>',
            esc_url($del_url)
        );
    }
    return $actions;
}

// Safely remove the legacy "Hero Banner" WooCommerce product category term
function modena_remove_legacy_hero_banner_category() {
    $taxonomies = array('product_cat', 'category');
    foreach ($taxonomies as $taxonomy) {
        if (taxonomy_exists($taxonomy)) {
            $term = get_term_by('slug', 'hero-banner', $taxonomy);
            if ($term && !is_wp_error($term)) {
                wp_delete_term($term->term_id, $taxonomy);
            }
            $term_space = get_term_by('name', 'Hero Banner', $taxonomy);
            if ($term_space && !is_wp_error($term_space)) {
                wp_delete_term($term_space->term_id, $taxonomy);
            }
            $term_herobanner = get_term_by('slug', 'herobanner', $taxonomy);
            if ($term_herobanner && !is_wp_error($term_herobanner)) {
                wp_delete_term($term_herobanner->term_id, $taxonomy);
            }
        }
    }
}
add_action('init', 'modena_remove_legacy_hero_banner_category', 99);

/**
 * STORE POLICY ENFORCEMENT
 * 100% Prepaid Payments Only. Cash on Delivery (COD) is NOT available.
 */

add_filter('rest_pre_dispatch', function($result, $server, $request) {
    if ($request && method_exists($request, 'get_route')) {
        $route = $request->get_route();
        if (strpos($route, '/modena/v1/') !== false) {
            if ($route === '/modena/v1/delete-review' && $_SERVER['REQUEST_METHOD'] === 'POST') {
                return modena_handle_delete_review($request);
            }
            if ($route === '/modena/v1/submit-review' && $_SERVER['REQUEST_METHOD'] === 'POST') {
                return modena_handle_submit_review($request);
            }
            if ($route === '/modena/v1/product-reviews') {
                return modena_handle_get_product_reviews($request);
            }
            if ($route === '/modena/v1/site-reviews') {
                return modena_handle_get_site_reviews($request);
            }
        }
    }
    return $result;
}, 1, 3);

add_filter('rest_authentication_errors', function ($result) {
    if (isset($_SERVER['REQUEST_URI']) && strpos($_SERVER['REQUEST_URI'], '/wp-json/modena/v1/') !== false) {
        return true;
    }
    return $result;
}, 999999);

add_filter('rest_request_before_callbacks', function ($response, $handler, $request) {
    if ($request && method_exists($request, 'get_route') && strpos($request->get_route(), '/modena/v1/') !== false) {
        return null;
    }
    return $response;
}, 1, 3);

/**
 * MODENA PRODUCT REVIEWS API ENDPOINTS
 * Handles product review fetching, submitting, and WooCommerce rating synchronization
 */
add_action('rest_api_init', function () {
    // 1. Submit Review Endpoint
    register_rest_route('modena/v1', '/submit-review', [
        'methods'  => 'POST',
        'callback' => 'modena_handle_submit_review',
        'permission_callback' => function() { return true; }
    ]);

    // 2. Fetch Product Reviews Endpoint
    register_rest_route('modena/v1', '/product-reviews', [
        'methods'  => 'GET',
        'callback' => 'modena_handle_get_product_reviews',
        'permission_callback' => function() { return true; }
    ]);

    // 3. Home Page Slider Reviews Endpoint (Only 4★ and 5★ approved reviews)
    register_rest_route('modena/v1', '/site-reviews', [
        'methods'  => 'GET',
        'callback' => 'modena_handle_get_site_reviews',
        'permission_callback' => function() { return true; }
    ]);

    // 4. Delete Review Endpoint (Admin or Review Author)
    register_rest_route('modena/v1', '/delete-review', [
        'methods'  => 'POST',
        'callback' => 'modena_handle_delete_review',
        'permission_callback' => function() { return true; }
    ]);
});

function modena_handle_submit_review($request) {
    $params = $request->get_json_params();
    $product_id = isset($params['product_id']) ? absint($params['product_id']) : 0;
    $raw_reviewer = isset($params['reviewer']) ? sanitize_text_field($params['reviewer']) : 'Verified Customer';
    $reviewer   = substr($raw_reviewer, 0, 100);
    $raw_email  = isset($params['reviewer_email']) ? sanitize_email($params['reviewer_email']) : 'customer@modenahome.in';
    $email      = substr($raw_email, 0, 254);
    $raw_review = isset($params['review']) ? sanitize_textarea_field($params['review']) : '';
    $review_content = substr($raw_review, 0, 2000);
    $rating_val = isset($params['rating']) ? intval($params['rating']) : 5;
    $rating     = max(1, min(5, $rating_val));
    $verified   = !empty($params['verified']);

    if (!$product_id || strlen($review_content) < 3) {
        return new WP_Error('invalid_data', 'Valid Product ID and review content (min 3 characters) are required.', ['status' => 400]);
    }

    if (!get_post($product_id)) {
        return new WP_Error('invalid_product', 'The specified product does not exist.', ['status' => 404]);
    }

    $comment_data = [
        'comment_post_ID'      => $product_id,
        'comment_author'       => $reviewer,
        'comment_author_email' => $email,
        'comment_content'      => $review_content,
        'comment_type'         => 'review',
        'comment_parent'       => 0,
        'user_id'              => get_current_user_id(),
        'comment_author_IP'    => sanitize_text_field($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'),
        'comment_agent'        => sanitize_text_field(substr($_SERVER['HTTP_USER_AGENT'] ?? 'Modena WebApp', 0, 254)),
        'comment_date'         => current_time('mysql'),
        'comment_approved'     => 1
    ];

    $comment_id = wp_insert_comment($comment_data);
    if (!$comment_id) {
        return new WP_Error('comment_failed', 'Failed to save review in database.', ['status' => 500]);
    }

    update_comment_meta($comment_id, 'rating', $rating);
    update_comment_meta($comment_id, 'verified', $verified ? 1 : 0);

    // Recalculate WooCommerce Product Ratings & Review Count
    modena_recalculate_product_rating($product_id);

    return new WP_REST_Response([
        'success'    => true,
        'comment_id' => $comment_id,
        'message'    => 'Review submitted and approved successfully.',
        'review'     => [
            'id'                     => $comment_id,
            'product_id'             => $product_id,
            'reviewer'               => $reviewer,
            'review'                 => $review_content,
            'rating'                 => $rating,
            'verified'               => $verified,
            'date_created'           => current_time('mysql'),
            'formatted_date_created' => date('F j, Y')
        ]
    ], 200);
}

function modena_handle_get_product_reviews($request) {
    $product_id = isset($_GET['product_id']) ? absint($_GET['product_id']) : 0;
    if (!$product_id) {
        return new WP_REST_Response([], 200);
    }

    $comments = get_comments([
        'post_id' => $product_id,
        'status'  => 'approve',
        'type'    => 'review'
    ]);

    $reviews = [];
    foreach ($comments as $c) {
        $rating = intval(get_comment_meta($c->comment_ID, 'rating', true) ?: 5);
        $verified = boolval(get_comment_meta($c->comment_ID, 'verified', true));
        $reviews[] = [
            'id'                     => intval($c->comment_ID),
            'product_id'             => intval($c->comment_post_ID),
            'reviewer'               => sanitize_text_field($c->comment_author),
            'reviewer_email'         => sanitize_email($c->comment_author_email),
            'review'                 => sanitize_textarea_field($c->comment_content),
            'rating'                 => $rating,
            'verified'               => $verified,
            'date_created'           => $c->comment_date,
            'formatted_date_created' => date('F j, Y', strtotime($c->comment_date))
        ];
    }

    return new WP_REST_Response($reviews, 200);
}

function modena_handle_get_site_reviews($request) {
    $comments = get_comments([
        'status' => 'approve',
        'type'   => 'review',
        'number' => 20
    ]);

    $reviews = [];
    foreach ($comments as $c) {
        $rating = intval(get_comment_meta($c->comment_ID, 'rating', true) ?: 5);
        if ($rating >= 4) {
            $product_id = intval($c->comment_post_ID);
            $product = function_exists('wc_get_product') ? wc_get_product($product_id) : null;
            $product_name = $product ? $product->get_name() : get_the_title($product_id);
            $product_image = '';
            if ($product && $product->get_image_id()) {
                $product_image = wp_get_attachment_image_url($product->get_image_id(), 'thumbnail');
            }

            $reviews[] = [
                'id'            => strval($c->comment_ID),
                'author'        => sanitize_text_field($c->comment_author),
                'content'       => wp_strip_all_tags($c->comment_content),
                'rating'        => $rating,
                'date'          => $c->comment_date,
                'product_id'    => strval($product_id),
                'product_name'  => sanitize_text_field($product_name),
                'product_image' => esc_url($product_image)
            ];
        }
    }

    return new WP_REST_Response($reviews, 200);
}

function modena_handle_delete_review($request) {
    $params = $request->get_json_params();
    $comment_id = isset($params['comment_id']) ? absint($params['comment_id']) : 0;
    $product_id = isset($params['product_id']) ? absint($params['product_id']) : 0;

    if (!$comment_id) {
        return new WP_Error('invalid_id', 'Comment ID is required.', ['status' => 400]);
    }

    $comment = get_comment($comment_id);
    if (!$comment) {
        return new WP_REST_Response(['success' => true, 'message' => 'Review already deleted or not found.'], 200);
    }

    // Permission validation: Only administrator or review author can delete
    $current_user_id = get_current_user_id();
    $can_delete = current_user_can('moderate_comments') || ($current_user_id > 0 && intval($comment->user_id) === $current_user_id);
    if (!$can_delete && !current_user_can('manage_options')) {
        return new WP_Error('forbidden', 'You do not have permission to delete this review.', ['status' => 403]);
    }

    $target_product_id = $product_id ? $product_id : intval($comment->comment_post_ID);

    // Securely delete comment using WordPress core API
    wp_delete_comment($comment_id, true);

    if ($target_product_id) {
        modena_recalculate_product_rating($target_product_id);
    }

    return new WP_REST_Response([
        'success'    => true,
        'comment_id' => $comment_id,
        'message'    => 'Review deleted successfully.'
    ], 200);
}

function modena_recalculate_product_rating($product_id) {
    $comments = get_comments([
        'post_id' => $product_id,
        'status'  => 'approve',
        'type'    => 'review'
    ]);

    $count = count($comments);
    $total_rating = 0;
    foreach ($comments as $c) {
        $total_rating += intval(get_comment_meta($c->comment_ID, 'rating', true) ?: 5);
    }

    $average = $count > 0 ? round($total_rating / $count, 2) : 0;

    update_post_meta($product_id, '_wc_average_rating', $average);
    update_post_meta($product_id, '_wc_review_count', $count);

    if (function_exists('wc_delete_product_transients')) {
        wc_delete_product_transients($product_id);
    }
}

add_action('rest_api_init', function() {
    register_rest_route('modena/v1', '/merge-kitchenware', array(
        'methods'  => 'GET',
        'callback' => function() {
            $cookware_term = get_term_by('slug', 'cookware', 'product_cat');
            $kitchenware_term = get_term_by('slug', 'kitchenware', 'product_cat');
            if (!$cookware_term) {
                $cookware_term = wp_insert_term('Cookware', 'product_cat', ['slug' => 'cookware']);
                $cookware_id = is_array($cookware_term) ? $cookware_term['term_id'] : $cookware_term;
            } else {
                $cookware_id = $cookware_term->term_id;
            }

            $moved = array();
            if ($kitchenware_term) {
                $kitchenware_id = $kitchenware_term->term_id;
                $products = get_posts(array(
                    'post_type' => 'product',
                    'numberposts' => -1,
                    'tax_query' => array(
                        array(
                            'taxonomy' => 'product_cat',
                            'field' => 'term_id',
                            'terms' => $kitchenware_id,
                        )
                    )
                ));

                foreach ($products as $p) {
                    $current_terms = wp_get_post_terms($p->ID, 'product_cat', array('fields' => 'ids'));
                    $new_terms = array_diff($current_terms, array($kitchenware_id));
                    if (!in_array($cookware_id, $new_terms)) {
                        $new_terms[] = $cookware_id;
                    }
                    wp_set_post_terms($p->ID, $new_terms, 'product_cat', false);
                    $moved[] = array('id' => $p->ID, 'title' => $p->post_title);
                }

                wp_delete_term($kitchenware_id, 'product_cat');
            }

            wp_update_term_count_now(array($cookware_id), 'product_cat');

            return array(
                'success' => true,
                'moved' => $moved,
                'cookware_id' => $cookware_id
            );
        },
        'permission_callback' => '__return_true'
    ));
});

/**
 * =========================================================================
 * WOOCOMMERCE SUBCATEGORY SYSTEM & 2-SUBCATEGORY LIMIT ENFORCEMENT
 * =========================================================================
 */

// 1. Enforce Maximum 2 Subcategories on Category Creation
add_filter('pre_insert_term', function ($term, $taxonomy, $args) {
    if ($taxonomy !== 'product_cat') {
        return $term;
    }
    $parent = isset($args['parent']) ? intval($args['parent']) : 0;
    if ($parent > 0) {
        $existing_children = get_terms([
            'taxonomy'   => 'product_cat',
            'parent'     => $parent,
            'hide_empty' => false,
            'fields'     => 'ids'
        ]);
        if (!is_wp_error($existing_children) && count($existing_children) >= 2) {
            $parent_term = get_term($parent, 'product_cat');
            $parent_name = ($parent_term && !is_wp_error($parent_term)) ? $parent_term->name : 'this category';
            return new WP_Error(
                'max_subcategories_exceeded',
                sprintf(__('Maximum 2 subcategories are allowed under "%s".'), $parent_name)
            );
        }
    }
    return $term;
}, 10, 3);

// 2. Enforce Maximum 2 Subcategories on Category Edit / Update
add_filter('wp_update_term_data', function ($data, $term_id, $taxonomy, $args) {
    if ($taxonomy !== 'product_cat') {
        return $data;
    }
    $parent = isset($args['parent']) ? intval($args['parent']) : 0;
    if ($parent > 0) {
        $existing_children = get_terms([
            'taxonomy'   => 'product_cat',
            'parent'     => $parent,
            'hide_empty' => false,
            'exclude'    => [$term_id],
            'fields'     => 'ids'
        ]);
        if (!is_wp_error($existing_children) && count($existing_children) >= 2) {
            $parent_term = get_term($parent, 'product_cat');
            $parent_name = ($parent_term && !is_wp_error($parent_term)) ? $parent_term->name : 'this category';
            wp_die(
                sprintf(__('Error: Maximum of 2 subcategories allowed under "%s". Please remove or change an existing subcategory first.'), $parent_name),
                __('Subcategory Limit Reached'),
                ['back_link' => true]
            );
        }
    }
    return $data;
}, 10, 4);

// 3. Admin Notice for Product Category Screen
add_action('admin_notices', function() {
    $screen = function_exists('get_current_screen') ? get_current_screen() : null;
    if ($screen && isset($screen->taxonomy) && $screen->taxonomy === 'product_cat') {
        echo '<div class="notice notice-info is-dismissible"><p><strong>Modena Dynamic Subcategories:</strong> Each main category supports a <strong>maximum of 2 subcategories</strong>. Child subcategories with products will automatically generate dedicated components on their parent category page.</p></div>';
    }
});

// 4. REST API Endpoint for Category Hierarchy (Capped at 2 subcategories per parent)
add_action('rest_api_init', function () {
    register_rest_route('modena/v1', '/category-hierarchy', [
        'methods'             => 'GET',
        'callback'            => 'modena_get_category_hierarchy',
        'permission_callback' => '__return_true'
    ]);
});

function modena_get_category_hierarchy() {
    $terms = get_terms([
        'taxonomy'   => 'product_cat',
        'hide_empty' => false,
        'orderby'    => 'menu_order',
        'order'      => 'ASC'
    ]);

    if (is_wp_error($terms) || empty($terms)) {
        return [];
    }

    $parents = [];
    $children = [];

    foreach ($terms as $t) {
        if ($t->parent == 0) {
            $parents[$t->term_id] = [
                'id'            => $t->term_id,
                'name'          => html_entity_decode($t->name, ENT_QUOTES, 'UTF-8'),
                'slug'          => $t->slug,
                'count'         => $t->count,
                'menu_order'    => isset($t->menu_order) ? intval($t->menu_order) : 0,
                'subcategories' => []
            ];
        } else {
            $children[$t->parent][] = [
                'id'         => $t->term_id,
                'name'       => html_entity_decode($t->name, ENT_QUOTES, 'UTF-8'),
                'slug'       => $t->slug,
                'count'      => $t->count,
                'parent'     => $t->parent,
                'menu_order' => isset($t->menu_order) ? intval($t->menu_order) : 0
            ];
        }
    }

    foreach ($children as $parentId => $subList) {
        if (isset($parents[$parentId])) {
            // Sort by menu_order
            usort($subList, function($a, $b) {
                return $a['menu_order'] - $b['menu_order'];
            });
            // Strictly enforce maximum 2 subcategories per main category
            $parents[$parentId]['subcategories'] = array_slice($subList, 0, 2);
        }
    }

    return array_values($parents);
}

/**
 * =========================================================================
 * CORPORATE GIFTING ENQUIRY & MESSAGE INBOX SYSTEM (WordPress Admin)
 * =========================================================================
 */

// 1. Register Underlying Storage Post Type (UI disabled so it functions strictly as a message store)
add_action('init', function() {
    register_post_type('gifting_enquiry', [
        'labels' => [
            'name'               => 'Corporate Enquiries',
            'singular_name'      => 'Corporate Enquiry',
            'all_items'          => 'All Enquiries',
            'menu_name'          => 'Gifting Enquiries'
        ],
        'public'          => false,
        'show_ui'         => false,
        'show_in_menu'    => false,
        'capability_type' => 'post',
        'hierarchical'    => false,
        'supports'        => ['title']
    ]);
});

// 2. Add Top-Level Dedicated "Gifting Enquiries" Admin Menu Page
add_action('admin_menu', function() {
    // Calculate unread/new inquiries count badge
    $new_count = count(get_posts([
        'post_type'      => 'gifting_enquiry',
        'post_status'    => 'publish',
        'posts_per_page' => -1,
        'meta_query'     => [
            'relation' => 'OR',
            [
                'key'     => '_status',
                'value'   => 'New',
                'compare' => '='
            ],
            [
                'key'     => '_status',
                'compare' => 'NOT EXISTS'
            ]
        ]
    ]));

    $menu_title = 'Gifting Enquiries';
    if ($new_count > 0) {
        $menu_title .= ' <span class="update-plugins count-' . $new_count . '"><span class="plugin-count">' . $new_count . '</span></span>';
    }

    add_menu_page(
        'Corporate Gifting Enquiries',
        $menu_title,
        'manage_options',
        'modena-gifting-enquiries',
        'modena_render_gifting_enquiries_admin_page',
        'dashicons-email-alt',
        26
    );
});

// 3. Render Dedicated Admin Message Inbox
function modena_render_gifting_enquiries_admin_page() {
    if (!current_user_can('manage_options')) {
        wp_die(__('You do not have sufficient permissions to access this page.'));
    }

    // Handle Status Updates & Actions
    if (isset($_POST['modena_enquiry_action']) && check_admin_referer('modena_enquiry_admin_nonce')) {
        $action_post_id = intval($_POST['enquiry_id']);
        $new_status     = sanitize_text_field($_POST['new_status'] ?? '');
        $is_delete      = !empty($_POST['delete_enquiry']);

        if ($action_post_id > 0) {
            if ($is_delete) {
                wp_delete_post($action_post_id, true);
                echo '<div class="notice notice-success is-dismissible"><p>Enquiry deleted successfully.</p></div>';
            } elseif (in_array($new_status, ['New', 'Read', 'Contacted', 'Closed'])) {
                update_post_meta($action_post_id, '_status', $new_status);
                echo '<div class="notice notice-success is-dismissible"><p>Enquiry status updated to <strong>' . esc_html($new_status) . '</strong>.</p></div>';
            }
        }
    }

    $current_filter = sanitize_text_field($_GET['status_filter'] ?? 'all');

    // Query Enquiries
    $query_args = [
        'post_type'      => 'gifting_enquiry',
        'post_status'    => 'publish',
        'posts_per_page' => 50,
        'orderby'        => 'date',
        'order'          => 'DESC'
    ];

    if ($current_filter !== 'all') {
        if ($current_filter === 'New') {
            $query_args['meta_query'] = [
                'relation' => 'OR',
                [
                    'key'     => '_status',
                    'value'   => 'New',
                    'compare' => '='
                ],
                [
                    'key'     => '_status',
                    'compare' => 'NOT EXISTS'
                ]
            ];
        } else {
            $query_args['meta_query'] = [
                [
                    'key'     => '_status',
                    'value'   => $current_filter,
                    'compare' => '='
                ]
            ];
        }
    }

    $enquiry_posts = get_posts($query_args);

    // Compute Status Counts
    $all_posts = get_posts([
        'post_type'      => 'gifting_enquiry',
        'post_status'    => 'publish',
        'posts_per_page' => -1
    ]);

    $counts = ['all' => count($all_posts), 'New' => 0, 'Read' => 0, 'Contacted' => 0, 'Closed' => 0];
    foreach ($all_posts as $p) {
        $st = get_post_meta($p->ID, '_status', true) ?: 'New';
        if (isset($counts[$st])) {
            $counts[$st]++;
        } else {
            $counts['New']++;
        }
    }

    ?>
    <div class="wrap" style="max-width: 1200px;">
        <h1 style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
            <span class="dashicons dashicons-email-alt" style="font-size: 28px; width: 28px; height: 28px;"></span>
            Corporate Gifting Enquiries
        </h1>

        <!-- Filter Status Navigation Tabs -->
        <ul class="subsubsub" style="margin-bottom: 20px;">
            <li>
                <a href="<?php echo admin_url('admin.php?page=modena-gifting-enquiries&status_filter=all'); ?>" class="<?php echo $current_filter === 'all' ? 'current' : ''; ?>">
                    All <span class="count">(<?php echo $counts['all']; ?>)</span>
                </a> |
            </li>
            <li>
                <a href="<?php echo admin_url('admin.php?page=modena-gifting-enquiries&status_filter=New'); ?>" class="<?php echo $current_filter === 'New' ? 'current' : ''; ?>" style="<?php echo $counts['New'] > 0 ? 'font-weight: bold; color: #d63638;' : ''; ?>">
                    New <span class="count">(<?php echo $counts['New']; ?>)</span>
                </a> |
            </li>
            <li>
                <a href="<?php echo admin_url('admin.php?page=modena-gifting-enquiries&status_filter=Read'); ?>" class="<?php echo $current_filter === 'Read' ? 'current' : ''; ?>">
                    Read <span class="count">(<?php echo $counts['Read']; ?>)</span>
                </a> |
            </li>
            <li>
                <a href="<?php echo admin_url('admin.php?page=modena-gifting-enquiries&status_filter=Contacted'); ?>" class="<?php echo $current_filter === 'Contacted' ? 'current' : ''; ?>">
                    Contacted <span class="count">(<?php echo $counts['Contacted']; ?>)</span>
                </a> |
            </li>
            <li>
                <a href="<?php echo admin_url('admin.php?page=modena-gifting-enquiries&status_filter=Closed'); ?>" class="<?php echo $current_filter === 'Closed' ? 'current' : ''; ?>">
                    Closed <span class="count">(<?php echo $counts['Closed']; ?>)</span>
                </a>
            </li>
        </ul>
        <div class="clear"></div>

        <?php if (empty($enquiry_posts)): ?>
            <div style="background: #fff; border: 1px solid #ccd0d4; padding: 40px; text-align: center; border-radius: 8px; margin-top: 20px;">
                <p style="font-size: 16px; color: #646970; margin: 0;">No corporate gifting enquiries found in this view.</p>
            </div>
        <?php else: ?>
            <div style="display: flex; flex-direction: column; gap: 15px; margin-top: 15px;">
                <?php foreach ($enquiry_posts as $enquiry):
                    $full_name    = get_post_meta($enquiry->ID, '_full_name', true) ?: 'Anonymous Customer';
                    $company_name = get_post_meta($enquiry->ID, '_company_name', true) ?: 'Private Organization';
                    $email        = get_post_meta($enquiry->ID, '_email', true) ?: '';
                    $phone        = get_post_meta($enquiry->ID, '_phone', true) ?: '';
                    $quantity     = get_post_meta($enquiry->ID, '_quantity', true) ?: 1;
                    $status       = get_post_meta($enquiry->ID, '_status', true) ?: 'New';
                    $submitted_at = get_post_meta($enquiry->ID, '_submitted_at', true) ?: get_the_date('Y-m-d H:i', $enquiry->ID);
                    $message      = $enquiry->post_content ?: 'No specific message provided.';

                    $status_colors = [
                        'New'       => ['bg' => '#fbeaea', 'color' => '#d63638', 'border' => '#f5c6cb'],
                        'Read'      => ['bg' => '#e8f4fc', 'color' => '#2271b1', 'border' => '#b8daff'],
                        'Contacted' => ['bg' => '#f3e8fd', 'color' => '#722ed1', 'border' => '#d3adf7'],
                        'Closed'    => ['bg' => '#f0f0f1', 'color' => '#646970', 'border' => '#dcdcde']
                    ];
                    $badge = $status_colors[$status] ?? $status_colors['New'];
                    $clean_phone = preg_replace('/[^0-9]/', '', $phone);
                ?>
                <div style="background: #fff; border: 1px solid #ccd0d4; border-left: 4px solid <?php echo $badge['color']; ?>; border-radius: 6px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; border-bottom: 1px solid #f0f0f1; pb: 10px; padding-bottom: 10px;">
                        <div>
                            <span style="display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; background: <?php echo $badge['bg']; ?>; color: <?php echo $badge['color']; ?>; border: 1px solid <?php echo $badge['border']; ?>;">
                                <?php echo esc_html($status); ?>
                            </span>
                            <span style="color: #646970; font-size: 12px; margin-left: 10px;">
                                Submitted on: <strong><?php echo esc_html(date_i18n('d M Y, h:i A', strtotime($submitted_at))); ?></strong>
                            </span>
                        </div>

                        <!-- Status Management Form -->
                        <form method="post" style="display: flex; align-items: center; gap: 8px; margin: 0;">
                            <?php wp_nonce_field('modena_enquiry_admin_nonce'); ?>
                            <input type="hidden" name="enquiry_id" value="<?php echo $enquiry->ID; ?>">
                            <input type="hidden" name="modena_enquiry_action" value="1">
                            
                            <label for="status_<?php echo $enquiry->ID; ?>" style="font-size: 12px; font-weight: 600; color: #50575e;">Status:</label>
                            <select name="new_status" id="status_<?php echo $enquiry->ID; ?>" style="font-size: 12px; height: 30px;" onchange="this.form.submit()">
                                <option value="New" <?php selected($status, 'New'); ?>>New</option>
                                <option value="Read" <?php selected($status, 'Read'); ?>>Read</option>
                                <option value="Contacted" <?php selected($status, 'Contacted'); ?>>Contacted</option>
                                <option value="Closed" <?php selected($status, 'Closed'); ?>>Closed</option>
                            </select>

                            <button type="submit" name="delete_enquiry" value="1" onclick="return confirm('Are you sure you want to delete this enquiry?');" style="background: none; border: none; color: #d63638; cursor: pointer; text-decoration: underline; font-size: 12px; margin-left: 8px;">
                                Delete
                            </button>
                        </form>
                    </div>

                    <!-- Customer & Company Info Grid -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 15px; background: #f9f9fb; padding: 12px 16px; border-radius: 6px;">
                        <div>
                            <div style="font-size: 11px; color: #8c8f94; text-transform: uppercase; font-weight: 700;">Customer Name</div>
                            <div style="font-size: 14px; font-weight: 700; color: #1d2327; margin-top: 2px;"><?php echo esc_html($full_name); ?></div>
                        </div>
                        <div>
                            <div style="font-size: 11px; color: #8c8f94; text-transform: uppercase; font-weight: 700;">Company Name</div>
                            <div style="font-size: 14px; font-weight: 700; color: #1d2327; margin-top: 2px;"><?php echo esc_html($company_name); ?></div>
                        </div>
                        <div>
                            <div style="font-size: 11px; color: #8c8f94; text-transform: uppercase; font-weight: 700;">Units / Quantity</div>
                            <div style="font-size: 14px; font-weight: 800; color: #c91f26; margin-top: 2px;"><?php echo esc_html($quantity); ?> units</div>
                        </div>
                        <div>
                            <div style="font-size: 11px; color: #8c8f94; text-transform: uppercase; font-weight: 700;">Contact Details</div>
                            <div style="font-size: 13px; margin-top: 2px;">
                                <?php if ($email): ?>
                                    <a href="mailto:<?php echo esc_attr($email); ?>" style="text-decoration: none; font-weight: 600; color: #2271b1;"><?php echo esc_html($email); ?></a><br>
                                <?php endif; ?>
                                <?php if ($phone): ?>
                                    <a href="tel:<?php echo esc_attr($phone); ?>" style="text-decoration: none; font-weight: 600; color: #50575e;"><?php echo esc_html($phone); ?></a>
                                    <?php if (!empty($clean_phone)): ?>
                                        • <a href="https://wa.me/<?php echo esc_attr($clean_phone); ?>" target="_blank" style="color: #25D366; font-weight: 700; text-decoration: none;">WhatsApp</a>
                                    <?php endif; ?>
                                <?php endif; ?>
                            </div>
                        </div>
                    </div>

                    <!-- Customer Message -->
                    <div>
                        <div style="font-size: 12px; font-weight: 700; color: #50575e; margin-bottom: 4px;">Requirements &amp; Message:</div>
                        <div style="font-size: 13px; line-height: 1.6; color: #2c3338; background: #fff; border: 1px solid #e2e4e7; border-radius: 4px; padding: 12px 15px; white-space: pre-wrap;"><?php echo esc_html($message); ?></div>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </div>
    <?php
}

// 4. REST API Endpoint for Submitting Enquiries
add_action('rest_api_init', function () {
    register_rest_route('modena/v1', '/corporate-gifting-enquiry', [
        'methods'             => 'POST',
        'callback'            => 'modena_handle_corporate_gifting_enquiry',
        'permission_callback' => '__return_true'
    ]);
});

function modena_handle_corporate_gifting_enquiry($request) {
    $params = $request->get_json_params();
    if (empty($params) || !is_array($params)) {
        $params = $request->get_params();
    }
    if (empty($params) || !is_array($params)) {
        $raw = file_get_contents('php://input');
        $params = json_decode($raw, true) ?: [];
    }

    // 1. Honeypot check for spam protection
    if (!empty($params['website_url']) || !empty($params['_hp_check'])) {
        return new WP_REST_Response([
            'success' => true,
            'message' => 'Thank you. Your enquiry has been received.'
        ], 200);
    }

    // 2. Extract, Size-Limit & Sanitize fields
    $full_name    = isset($params['full_name']) ? sanitize_text_field(substr(strval($params['full_name']), 0, 120)) : '';
    $company_name = isset($params['company_name']) ? sanitize_text_field(substr(strval($params['company_name']), 0, 150)) : '';
    $email        = isset($params['email']) ? sanitize_email(substr(strval($params['email']), 0, 254)) : '';
    $phone        = isset($params['phone']) ? sanitize_text_field(substr(strval($params['phone']), 0, 25)) : '';
    $quantity     = isset($params['quantity']) ? min(1000000, max(0, absint($params['quantity']))) : 0;
    $message      = isset($params['message']) ? sanitize_textarea_field(substr(strval($params['message']), 0, 3000)) : '';

    // 3. Backend Validation
    if (empty($full_name) || strlen($full_name) < 2) {
        return new WP_Error('missing_name', 'Please enter your name (min 2 characters).', ['status' => 400]);
    }
    if (empty($company_name) || strlen($company_name) < 2) {
        return new WP_Error('missing_company', 'Please enter your company name (min 2 characters).', ['status' => 400]);
    }
    if (empty($email) || !is_email($email)) {
        return new WP_Error('invalid_email', 'Please enter a valid email address.', ['status' => 400]);
    }
    if (empty($phone) || strlen(preg_replace('/[^0-9]/', '', $phone)) < 7) {
        return new WP_Error('invalid_phone', 'Please enter a valid phone number (min 7 digits).', ['status' => 400]);
    }
    if ($quantity <= 0 || $quantity > 1000000) {
        return new WP_Error('invalid_quantity', 'Please enter a valid quantity between 1 and 1,000,000.', ['status' => 400]);
    }
    if (empty($message) || strlen($message) < 5) {
        return new WP_Error('missing_message', 'Please enter your message or requirements (min 5 characters).', ['status' => 400]);
    }

    // 4. Save Enquiry to WordPress DB
    $post_id = wp_insert_post([
        'post_title'   => 'Corporate Gifting: ' . $company_name . ' (' . $full_name . ')',
        'post_content' => $message,
        'post_status'  => 'publish',
        'post_type'    => 'gifting_enquiry',
    ]);

    if (is_wp_error($post_id) || !$post_id) {
        // Fallback option storage
        $enquiries = get_option('modena_gifting_enquiries', []);
        $enquiries[] = [
            'id'           => time(),
            'full_name'    => $full_name,
            'company_name' => $company_name,
            'email'        => $email,
            'phone'        => $phone,
            'quantity'     => $quantity,
            'message'      => $message,
            'status'       => 'New',
            'created_at'   => current_time('mysql')
        ];
        update_option('modena_gifting_enquiries', $enquiries, false);
    } else {
        update_post_meta($post_id, '_full_name', $full_name);
        update_post_meta($post_id, '_company_name', $company_name);
        update_post_meta($post_id, '_email', $email);
        update_post_meta($post_id, '_phone', $phone);
        update_post_meta($post_id, '_quantity', $quantity);
        update_post_meta($post_id, '_status', 'New');
        update_post_meta($post_id, '_ip_address', sanitize_text_field($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'));
        update_post_meta($post_id, '_submitted_at', current_time('mysql'));
    }

    // 5. Send notification email to admin
    $admin_email = get_option('admin_email', 'support@modenahome.in');
    $subject = 'New Corporate Gifting Enquiry from ' . $company_name;
    $body = "New Corporate Gifting Enquiry\n"
          . "====================================\n\n"
          . "Customer Name: $full_name\n"
          . "Company Name:  $company_name\n"
          . "Email:         $email\n"
          . "Phone Number:  $phone\n"
          . "Quantity:      $quantity units\n"
          . "Submitted At:  " . current_time('mysql') . "\n\n"
          . "Requirements / Message:\n"
          . "------------------------------------\n"
          . "$message\n\n"
          . "====================================\n"
          . "Manage enquiries in WordPress Admin -> Gifting Enquiries\n";
    @wp_mail($admin_email, $subject, $body);

    return new WP_REST_Response([
        'success' => true,
        'message' => 'Thank you. Your enquiry has been received.'
    ], 200);
}

/**
 * =========================================================================
 * RECIPES & COOKING GUIDES SYSTEM (WordPress Custom Post Type & REST API)
 * =========================================================================
 */

// 1. Register Custom Post Type
add_action('init', function () {
    register_post_type('modena_recipe', [
        'labels' => [
            'name'               => 'Recipes & Guides',
            'singular_name'      => 'Recipe & Cooking Guide',
            'menu_name'          => 'Recipes & Guides',
            'name_admin_bar'     => 'Recipe',
            'add_new'            => 'Add New Recipe',
            'add_new_item'       => 'Add New Recipe & Cooking Guide',
            'new_item'           => 'New Recipe',
            'edit_item'          => 'Edit Recipe & Cooking Guide',
            'view_item'          => 'View Recipe',
            'all_items'          => 'All Recipes & Guides',
            'search_items'       => 'Search Recipes',
            'not_found'          => 'No recipes found.',
            'not_found_in_trash' => 'No recipes found in Trash.'
        ],
        'public'             => true,
        'has_archive'        => true,
        'show_in_rest'       => true,
        'show_ui'            => true,
        'show_in_menu'       => true,
        'menu_icon'          => 'dashicons-book-alt',
        'supports'           => ['title', 'thumbnail'],
        'rewrite'            => ['slug' => 'recipes']
    ]);
});

// 2. Enqueue Media Library Scripts for Recipe Admin
add_action('admin_enqueue_scripts', function ($hook) {
    global $post_type;
    if ($post_type === 'modena_recipe') {
        wp_enqueue_media();
    }
});

// 3. Simplified Recipe Meta Box in WordPress Admin
add_action('add_meta_boxes', function () {
    add_meta_box(
        'modena_recipe_details',
        'Recipe Details & Step Builder',
        'modena_render_recipe_meta_box',
        'modena_recipe',
        'normal',
        'high'
    );
});

function modena_render_recipe_meta_box($post) {
    wp_nonce_field('modena_recipe_meta_save', 'modena_recipe_meta_nonce');

    $thumbnail_id = get_post_thumbnail_id($post->ID);
    $thumbnail_url = $thumbnail_id ? wp_get_attachment_image_url($thumbnail_id, 'medium') : '';
    $excerpt = $post->post_excerpt ?: '';
    $ingredients = get_post_meta($post->ID, '_recipe_ingredients', true) ?: '';
    
    // Load step-by-step instructions
    $raw_steps = get_post_meta($post->ID, '_recipe_steps', true);
    if (is_string($raw_steps)) {
        $decoded = json_decode($raw_steps, true);
        $steps = is_array($decoded) ? $decoded : [];
    } elseif (is_array($raw_steps)) {
        $steps = $raw_steps;
    } else {
        $steps = [];
    }

    if (empty($steps)) {
        $legacy_instructions = get_post_meta($post->ID, '_recipe_instructions', true) ?: '';
        if (!empty($legacy_instructions)) {
            $steps = array_values(array_filter(array_map('trim', explode("\n", str_replace("\r", "", $legacy_instructions)))));
            $steps = array_map(function($s) {
                return preg_replace('/^(Step\s*\d+[:.]?\s*|\d+[\.)]\s*)/i', '', $s);
            }, $steps);
        }
    }
    if (empty($steps)) {
        $steps = [''];
    }

    // WooCommerce Products for Selector
    $selected_product_id = get_post_meta($post->ID, '_recommended_product_id', true) ?: '';
    $wc_products = get_posts([
        'post_type'      => 'product',
        'post_status'    => 'publish',
        'posts_per_page' => -1,
        'orderby'        => 'title',
        'order'          => 'ASC'
    ]);

    ?>
    <style>
        .modena-recipe-box { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, sans-serif; }
        .modena-field-group { margin-bottom: 22px; }
        .modena-field-group label { display: block; font-weight: 700; font-size: 13px; margin-bottom: 6px; color: #1d2327; }
        .modena-field-group .description { font-size: 12px; color: #646970; margin-top: 4px; }
        .recipe-step-item { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; background: #f6f7f7; border: 1px solid #dcdcde; border-radius: 6px; padding: 10px 14px; }
        .recipe-step-item .step-badge { font-weight: 800; font-size: 12px; color: #8c5a24; min-width: 60px; padding-top: 6px; text-transform: uppercase; }
        .recipe-step-item textarea { flex: 1; resize: vertical; min-height: 48px; border: 1px solid #8c8f94; border-radius: 4px; padding: 8px; font-size: 13px; }
        .recipe-step-item .remove-step-btn { color: #d63638; border: 1px solid #d63638; background: #fff; cursor: pointer; padding: 6px 12px; border-radius: 4px; font-weight: 600; font-size: 12px; transition: all 0.2s; align-self: flex-start; margin-top: 4px; }
        .recipe-step-item .remove-step-btn:hover { background: #d63638; color: #fff; }
        .image-preview-wrapper { margin-top: 10px; display: inline-block; position: relative; }
        .image-preview-wrapper img { max-width: 220px; max-height: 150px; border-radius: 6px; border: 1px solid #ccd0d4; object-fit: cover; display: block; }
    </style>

    <div class="modena-recipe-box">
        
        <!-- 1. Recipe Image (WordPress Media Library Only) -->
        <div class="modena-field-group">
            <label>Recipe Image (WordPress Media Library)</label>
            <input type="hidden" name="recipe_thumbnail_id" id="modena_recipe_thumbnail_id" value="<?php echo esc_attr($thumbnail_id); ?>">
            
            <div>
                <button type="button" class="button button-primary" id="modena_upload_image_btn">
                    <?php echo $thumbnail_id ? 'Change Image from Media Library' : 'Select / Upload Image from WordPress Media Library'; ?>
                </button>
                <button type="button" class="button" id="modena_remove_image_btn" style="<?php echo $thumbnail_id ? '' : 'display:none;'; ?> color: #d63638; margin-left: 8px;">
                    Remove Image
                </button>
            </div>
            <div class="image-preview-wrapper" id="modena_image_preview" style="<?php echo $thumbnail_url ? '' : 'display:none;'; ?>">
                <img src="<?php echo esc_url($thumbnail_url); ?>" alt="Recipe Preview" id="modena_preview_img">
            </div>
            <p class="description">Select a high quality food photo directly from the WordPress Media Library.</p>
        </div>

        <!-- 2. Short Description -->
        <div class="modena-field-group">
            <label for="recipe_excerpt">Short Description</label>
            <textarea name="recipe_excerpt" id="recipe_excerpt" rows="3" style="width: 100%; border: 1px solid #8c8f94; border-radius: 4px; padding: 8px; font-size: 13px;" placeholder="Brief summary of the recipe, heritage context, or texture profile..."><?php echo esc_textarea($excerpt); ?></textarea>
            <p class="description">Appears on the recipe overview cards and below the recipe title.</p>
        </div>

        <!-- 3. Ingredients -->
        <div class="modena-field-group">
            <label for="recipe_ingredients">Ingredients (One ingredient per line)</label>
            <textarea name="recipe_ingredients" id="recipe_ingredients" rows="6" style="width: 100%; border: 1px solid #8c8f94; border-radius: 4px; padding: 8px; font-size: 13px; line-height: 1.5;" placeholder="2 cups Parboiled Dosa Rice&#10;1/2 cup Whole Urad Dal&#10;1 tsp Fenugreek Seeds (Methi)&#10;Cold Pressed Ghee &amp; Salt to taste"><?php echo esc_textarea($ingredients); ?></textarea>
            <p class="description">Enter each ingredient on a new line.</p>
        </div>

        <!-- 4. Step-by-Step Cooking Instructions (Step Builder) -->
        <div class="modena-field-group">
            <label>Step-by-Step Cooking Instructions</label>
            <div id="recipe_steps_container">
                <?php foreach ($steps as $idx => $step_text): ?>
                    <div class="recipe-step-item">
                        <span class="step-badge">Step <?php echo $idx + 1; ?></span>
                        <textarea name="recipe_steps[]" rows="2" placeholder="Enter cooking instruction..."><?php echo esc_textarea($step_text); ?></textarea>
                        <button type="button" class="remove-step-btn">Remove</button>
                    </div>
                <?php endforeach; ?>
            </div>
            <button type="button" class="button button-secondary" id="add_step_btn" style="margin-top: 6px; font-weight: 600;">
                + Add Step
            </button>
            <p class="description">Click "+ Add Step" to add instruction boxes. Steps are numbered automatically.</p>
        </div>

        <!-- 5. Searchable Recommended WooCommerce Product -->
        <div class="modena-field-group">
            <label for="modena_product_search">Recommended Modena Cookware / Appliance</label>
            <div style="max-width: 500px; display: flex; flex-direction: column; gap: 8px;">
                <input type="text" id="modena_product_search" placeholder="🔍 Type to search products (e.g. Mixer, Tawa, Kadai, Pressure Cooker)..." style="width: 100%; padding: 6px 10px; border-radius: 4px; border: 1px solid #8c8f94;">
                <select name="recommended_product_id" id="modena_product_select" style="width: 100%; height: 36px; border-radius: 4px; border: 1px solid #8c8f94;">
                    <option value="">-- None / Select Recommended Modena Product --</option>
                    <?php foreach ($wc_products as $prod): 
                        $p_obj = function_exists('wc_get_product') ? wc_get_product($prod->ID) : null;
                        $price = $p_obj ? $p_obj->get_price() : '';
                        $price_text = $price ? " (₹" . number_format($price, 0) . ")" : '';
                    ?>
                        <option value="<?php echo $prod->ID; ?>" <?php selected($selected_product_id, $prod->ID); ?> data-name="<?php echo esc_attr(strtolower($prod->post_title)); ?>">
                            <?php echo esc_html($prod->post_title . $price_text); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
            <p class="description">Choose from your live WooCommerce catalog. Links directly to the product on the website.</p>
        </div>

    </div>

    <!-- JavaScript for Step Builder, Media Library Image & Searchable Dropdown -->
    <script>
    jQuery(document).ready(function($) {
        // --- 1. WordPress Media Library Image Selector ---
        var mediaFrame;
        $('#modena_upload_image_btn').on('click', function(e) {
            e.preventDefault();
            if (mediaFrame) {
                mediaFrame.open();
                return;
            }
            mediaFrame = wp.media({
                title: 'Select Recipe Image from Media Library',
                button: { text: 'Use this Image' },
                multiple: false
            });
            mediaFrame.on('select', function() {
                var attachment = mediaFrame.state().get('selection').first().toJSON();
                $('#modena_recipe_thumbnail_id').val(attachment.id);
                $('#modena_preview_img').attr('src', attachment.url);
                $('#modena_image_preview').show();
                $('#modena_remove_image_btn').show();
                $('#modena_upload_image_btn').text('Change Image from Media Library');
            });
            mediaFrame.open();
        });

        $('#modena_remove_image_btn').on('click', function(e) {
            e.preventDefault();
            $('#modena_recipe_thumbnail_id').val('');
            $('#modena_preview_img').attr('src', '');
            $('#modena_image_preview').hide();
            $(this).hide();
            $('#modena_upload_image_btn').text('Select / Upload Image from WordPress Media Library');
        });

        // --- 2. Step Builder with Automatic Renumbering ---
        function renumberSteps() {
            $('#recipe_steps_container .recipe-step-item').each(function(index) {
                $(this).find('.step-badge').text('Step ' + (index + 1));
            });
        }

        $('#add_step_btn').on('click', function(e) {
            e.preventDefault();
            var stepCount = $('#recipe_steps_container .recipe-step-item').length + 1;
            var html = '<div class="recipe-step-item">' +
                '<span class="step-badge">Step ' + stepCount + '</span>' +
                '<textarea name="recipe_steps[]" rows="2" placeholder="Enter cooking instruction..."></textarea>' +
                '<button type="button" class="remove-step-btn">Remove</button>' +
                '</div>';
            $('#recipe_steps_container').append(html);
            renumberSteps();
        });

        $('#recipe_steps_container').on('click', '.remove-step-btn', function(e) {
            e.preventDefault();
            if ($('#recipe_steps_container .recipe-step-item').length > 1) {
                $(this).closest('.recipe-step-item').remove();
                renumberSteps();
            } else {
                $(this).closest('.recipe-step-item').find('textarea').val('');
            }
        });

        // --- 3. Live Searchable WooCommerce Product Dropdown ---
        $('#modena_product_search').on('input', function() {
            var term = $(this).val().toLowerCase().trim();
            $('#modena_product_select option').each(function() {
                if ($(this).val() === '') return;
                var pName = $(this).data('name') || $(this).text().toLowerCase();
                if (term === '' || pName.indexOf(term) !== -1) {
                    $(this).show();
                } else {
                    $(this).hide();
                }
            });
        });
    });
    </script>
    <?php
}

// 4. Save Recipe Meta Fields
function modena_save_recipe_meta($post_id) {
    static $is_updating = false;
    if ($is_updating) {
        return;
    }

    if (!isset($_POST['modena_recipe_meta_nonce']) || !wp_verify_nonce($_POST['modena_recipe_meta_nonce'], 'modena_recipe_meta_save')) {
        return;
    }
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
    if (!current_user_can('edit_post', $post_id)) return;

    // 1. Recipe Image (Sync with WordPress Featured Image Thumbnail)
    if (isset($_POST['recipe_thumbnail_id'])) {
        $thumb_id = absint($_POST['recipe_thumbnail_id']);
        if ($thumb_id > 0) {
            set_post_thumbnail($post_id, $thumb_id);
        } else {
            delete_post_thumbnail($post_id);
        }
    }

    // 2. Short Description (Save as post_excerpt)
    if (isset($_POST['recipe_excerpt'])) {
        $is_updating = true;
        remove_action('save_post_modena_recipe', 'modena_save_recipe_meta');
        wp_update_post([
            'ID'           => $post_id,
            'post_excerpt' => sanitize_textarea_field($_POST['recipe_excerpt'])
        ]);
        add_action('save_post_modena_recipe', 'modena_save_recipe_meta');
        $is_updating = false;
    }

    // 3. Ingredients
    if (isset($_POST['recipe_ingredients'])) {
        update_post_meta($post_id, '_recipe_ingredients', sanitize_textarea_field($_POST['recipe_ingredients']));
    }

    // 4. Step-by-Step Cooking Instructions (Array of sanitized strings)
    if (isset($_POST['recipe_steps']) && is_array($_POST['recipe_steps'])) {
        $clean_steps = array_values(array_filter(array_map('sanitize_textarea_field', $_POST['recipe_steps'])));
        update_post_meta($post_id, '_recipe_steps', $clean_steps);
    }

    // 5. Recommended WooCommerce Product ID
    if (isset($_POST['recommended_product_id'])) {
        $prod_id = absint($_POST['recommended_product_id']);
        update_post_meta($post_id, '_recommended_product_id', $prod_id);
    }
}
add_action('save_post_modena_recipe', 'modena_save_recipe_meta');

// 5. Register Recipe REST API Endpoints
add_action('rest_api_init', function () {
    register_rest_route('modena/v1', '/recipes', [
        'methods'             => 'GET',
        'callback'            => 'modena_handle_get_recipes',
        'permission_callback' => '__return_true'
    ]);

    register_rest_route('modena/v1', '/recipes/(?P<slug>[a-zA-Z0-9_-]+)', [
        'methods'             => 'GET',
        'callback'            => 'modena_handle_get_single_recipe',
        'permission_callback' => '__return_true'
    ]);
});

function modena_format_recipe_post($post) {
    // 1. Recipe Image (WordPress Media Library only)
    $thumbnail_id = get_post_thumbnail_id($post->ID);
    $image = $thumbnail_id ? wp_get_attachment_image_url($thumbnail_id, 'large') : '';

    // 2. Ingredients list
    $raw_ingredients = get_post_meta($post->ID, '_recipe_ingredients', true) ?: '';
    $ingredients = array_values(array_filter(array_map('trim', explode("\n", str_replace("\r", "", $raw_ingredients)))));

    // 3. Step Builder Instructions
    $raw_steps = get_post_meta($post->ID, '_recipe_steps', true);
    if (is_string($raw_steps)) {
        $decoded = json_decode($raw_steps, true);
        $steps = is_array($decoded) ? $decoded : [];
    } elseif (is_array($raw_steps)) {
        $steps = $raw_steps;
    } else {
        $steps = [];
    }

    if (empty($steps)) {
        $legacy_instructions = get_post_meta($post->ID, '_recipe_instructions', true) ?: '';
        if (!empty($legacy_instructions)) {
            $steps = array_values(array_filter(array_map('trim', explode("\n", str_replace("\r", "", $legacy_instructions)))));
            $steps = array_map(function($s) {
                return preg_replace('/^(Step\s*\d+[:.]?\s*|\d+[\.)]\s*)/i', '', $s);
            }, $steps);
        }
    }
    $steps = array_values(array_filter(array_map('trim', $steps)));

    // 4. Live WooCommerce Recommended Product
    $prod_id = get_post_meta($post->ID, '_recommended_product_id', true);
    $recommended_product = null;

    if ($prod_id) {
        $product = function_exists('wc_get_product') ? wc_get_product($prod_id) : null;
        if ($product && $product->get_status() === 'publish') {
            $prod_image_id = $product->get_image_id();
            $prod_image = $prod_image_id ? wp_get_attachment_image_url($prod_image_id, 'medium') : '';
            $recommended_product = [
                'id'            => $product->get_id(),
                'name'          => html_entity_decode($product->get_name(), ENT_QUOTES, 'UTF-8'),
                'slug'          => $product->get_slug(),
                'price'         => $product->get_price(),
                'regular_price' => $product->get_regular_price(),
                'image'         => $prod_image,
                'permalink'     => get_permalink($product->get_id())
            ];
        }
    }

    return [
        'id'                  => $post->ID,
        'title'               => html_entity_decode($post->post_title, ENT_QUOTES, 'UTF-8'),
        'slug'                => $post->post_name,
        'excerpt'             => html_entity_decode($post->post_excerpt ?: wp_trim_words($post->post_content, 22), ENT_QUOTES, 'UTF-8'),
        'image'               => $image,
        'ingredients'         => $ingredients,
        'instructions'        => $steps,
        'recommended_product' => $recommended_product,
        'date'                => get_the_date('M d, Y', $post->ID)
    ];
}

function modena_handle_get_recipes($request) {
    $posts = get_posts([
        'post_type'      => 'modena_recipe',
        'post_status'    => 'publish',
        'posts_per_page' => 20,
        'orderby'        => 'menu_order date',
        'order'          => 'DESC'
    ]);

    $recipes = array_map('modena_format_recipe_post', $posts);
    return new WP_REST_Response($recipes, 200);
}

function modena_handle_get_single_recipe($request) {
    $raw_slug = $request->get_param('slug');
    $slug = sanitize_title(substr(strval($raw_slug), 0, 100));
    if (empty($slug)) {
        return new WP_Error('invalid_slug', 'Valid recipe slug is required.', ['status' => 400]);
    }

    $posts = get_posts([
        'name'        => $slug,
        'post_type'   => 'modena_recipe',
        'post_status' => 'publish',
        'numberposts' => 1
    ]);

    if (empty($posts)) {
        return new WP_Error('not_found', 'Recipe not found.', ['status' => 404]);
    }

    $recipe = modena_format_recipe_post($posts[0]);
    return new WP_REST_Response($recipe, 200);
}

/**
 * =========================================================================
 * MODENA REST API RATE LIMITING MIDDLEWARE
 * =========================================================================
 * Protects all WordPress REST API routes from brute-force and request flood.
 * 1. Global limit: 180 requests / 60 seconds per client IP
 * 2. Login/Auth limit: 5 failed attempts / 15 minutes per client IP
 * 3. Uses WordPress Transients for shared persistent cache across requests.
 * 4. Standard RateLimit-* and Retry-After headers.
 */
function modena_get_client_ip() {
    $headers = [
        'HTTP_CLIENT_IP',
        'HTTP_X_FORWARDED_FOR',
        'HTTP_X_FORWARDED',
        'HTTP_X_CLUSTER_CLIENT_IP',
        'HTTP_FORWARDED_FOR',
        'HTTP_FORWARDED',
        'REMOTE_ADDR'
    ];
    foreach ($headers as $key) {
        if (!empty($_SERVER[$key])) {
            $ip_list = explode(',', $_SERVER[$key]);
            $ip = trim($ip_list[0]);
            if (filter_var($ip, FILTER_VALIDATE_IP)) {
                return $ip;
            }
        }
    }
    return '127.0.0.1';
}

add_filter('rest_pre_dispatch', function($result, $server, $request) {
    if (!$request || !method_exists($request, 'get_route')) {
        return $result;
    }

    try {
        $ip = modena_get_client_ip();
        $ip_hash = md5($ip);
        $route = $request->get_route();
        $now = time();

        // 1. Check Login / Auth Failed Attempts Limit (5 per 15 min = 900s)
        $auth_routes = ['/jwt-auth/v1/token', '/modena/v1/check-user-exists', '/modena/v1/send-otp', '/modena/v1/verify-otp-register'];
        $is_auth = in_array($route, $auth_routes, true);

        if ($is_auth) {
            $auth_key = 'modena_rl_auth_' . $ip_hash;
            $failed_attempts = get_transient($auth_key);
            if ($failed_attempts !== false && is_array($failed_attempts)) {
                $valid_attempts = array_filter($failed_attempts, function($t) use ($now) {
                    return ($now - $t) < 900;
                });
                if (count($valid_attempts) >= 5) {
                    $oldest = reset($valid_attempts);
                    $retry_after = max(1, 900 - ($now - $oldest));
                    $response = new WP_REST_Response([
                        'code'    => 'too_many_login_attempts',
                        'message' => 'Too many login attempts. Please try again later.',
                        'data'    => ['status' => 429]
                    ], 429);
                    $response->header('Retry-After', (string)$retry_after);
                    $response->header('RateLimit-Limit', '5');
                    $response->header('RateLimit-Remaining', '0');
                    $response->header('RateLimit-Reset', (string)($now + $retry_after));
                    return $response;
                }
            }
        }

        // 2. Global Rate Limit (180 requests per 60 seconds)
        $global_key = 'modena_rl_global_' . $ip_hash;
        $global_requests = get_transient($global_key);
        if ($global_requests === false || !is_array($global_requests)) {
            $global_requests = [];
        }
        $valid_global = array_filter($global_requests, function($t) use ($now) {
            return ($now - $t) < 60;
        });

        if (count($valid_global) >= 180) {
            $oldest = reset($valid_global);
            $retry_after = max(1, 60 - ($now - $oldest));
            $response = new WP_REST_Response([
                'code'    => 'too_many_requests',
                'message' => 'Too many requests. Please slow down and try again later.',
                'data'    => ['status' => 429]
            ], 429);
            $response->header('Retry-After', (string)$retry_after);
            $response->header('RateLimit-Limit', '180');
            $response->header('RateLimit-Remaining', '0');
            $response->header('RateLimit-Reset', (string)($now + $retry_after));
            return $response;
        }

        $valid_global[] = $now;
        set_transient($global_key, $valid_global, 70);

    } catch (Exception $e) {
        // High-availability safety: Fail open on error
        error_log('Modena Rate Limiter error: ' . $e->getMessage());
    }

    return $result;
}, 0, 3);

// --- MODENA SECURITY HEADERS ---
function modena_add_security_headers() {
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: SAMEORIGIN');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
}
add_action('send_headers', 'modena_add_security_headers');

// --- MODENA REST API CACHING ---
function modena_rest_api_caching( $response, $server, $request ) {
    if ( ! is_object( $response ) || ! method_exists( $response, 'header' ) ) {
        return $response;
    }
    
    if ( ! is_object( $request ) || ! method_exists( $request, 'get_route' ) ) {
        return $response;
    }

    $route = $request->get_route();
    
    // Public Data (Cache for 5 minutes)
    $public_routes = array(
        '/wc/store/v1/products',
        '/wc/v3/products',
        '/wp/v2/recipes',
        '/modena/v1/hero-banners',
        '/modena/v1/product-reviews'
    );
    
    $is_public = false;
    foreach ($public_routes as $public_route) {
        if (strpos($route, $public_route) === 0) {
            $is_public = true;
            break;
        }
    }
    
    if ($is_public && $request->get_method() === 'GET') {
        $response->header( 'Cache-Control', 'public, max-age=300, stale-while-revalidate=60' );
    } else {
        // Private Data or Non-GET (No Cache)
        $response->header( 'Cache-Control', 'private, no-store, no-cache, must-revalidate, max-age=0' );
    }
    
    return $response;
}
add_filter( 'rest_post_dispatch', 'modena_rest_api_caching', 10, 3 );


// =============================================================================
// MODENA PRODUCTION INTEGRATIONS: META (PIXEL + CAPI), GOOGLE MERCHANT & SEO SCHEMA
// =============================================================================

// --- 1. META INTEGRATION (PIXEL + SERVER-SIDE CAPI + CATALOG FEED) ---

function modena_get_meta_credentials() {
    $pixel_id   = defined('META_PIXEL_ID') ? META_PIXEL_ID : get_option('modena_meta_pixel_id', '');
    $capi_token = defined('META_CAPI_TOKEN') ? META_CAPI_TOKEN : get_option('modena_meta_capi_token', '');
    return array(
        'pixel_id'   => $pixel_id,
        'capi_token' => $capi_token
    );
}

function modena_inject_meta_pixel_script() {
    $creds = modena_get_meta_credentials();
    $pixel_id = $creds['pixel_id'];
    
    if (empty($pixel_id)) {
        return;
    }
    ?>
    <!-- Meta Pixel Code -->
    <script id="meta-pixel-script">
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '<?php echo esc_js($pixel_id); ?>');
      fbq('track', 'PageView');
    </script>
    <noscript>
      <img height="1" width="1" style="display:none"
           src="https://www.facebook.com/tr?id=<?php echo esc_attr($pixel_id); ?>&ev=PageView&noscript=1"/>
    </noscript>
    <!-- End Meta Pixel Code -->
    <?php
}
add_action('wp_head', 'modena_inject_meta_pixel_script', 5);

function modena_send_meta_capi_event($event_name, $event_id, $custom_data = array(), $user_data = array()) {
    $creds = modena_get_meta_credentials();
    $pixel_id   = $creds['pixel_id'];
    $capi_token = $creds['capi_token'];

    if (empty($pixel_id) || empty($capi_token)) {
        return false;
    }

    $url = "https://graph.facebook.com/v19.0/{$pixel_id}/events?access_token={$capi_token}";

    $client_ip = isset($_SERVER['REMOTE_ADDR']) ? sanitize_text_field($_SERVER['REMOTE_ADDR']) : '';
    $user_agent = isset($_SERVER['HTTP_USER_AGENT']) ? sanitize_text_field($_SERVER['HTTP_USER_AGENT']) : '';

    $formatted_user_data = array(
        'client_ip_address' => $client_ip,
        'client_user_agent' => $user_agent
    );

    if (!empty($user_data['email'])) {
        $formatted_user_data['em'] = hash('sha256', strtolower(trim($user_data['email'])));
    }
    if (!empty($user_data['phone'])) {
        $formatted_user_data['ph'] = hash('sha256', preg_replace('/[^0-9]/', '', $user_data['phone']));
    }
    if (!empty($user_data['first_name'])) {
        $formatted_user_data['fn'] = hash('sha256', strtolower(trim($user_data['first_name'])));
    }
    if (!empty($user_data['last_name'])) {
        $formatted_user_data['ln'] = hash('sha256', strtolower(trim($user_data['last_name'])));
    }

    $event_payload = array(
        'data' => array(
            array(
                'event_name'       => $event_name,
                'event_time'       => time(),
                'event_id'         => $event_id,
                'event_source_url' => isset($_SERVER['HTTP_REFERER']) ? esc_url_raw($_SERVER['HTTP_REFERER']) : home_url(),
                'action_source'    => 'website',
                'user_data'        => $formatted_user_data,
                'custom_data'      => $custom_data
            )
        )
    );

    $response = wp_remote_post($url, array(
        'headers' => array('Content-Type' => 'application/json'),
        'body'    => json_encode($event_payload),
        'timeout' => 10
    ));

    return !is_wp_error($response);
}

function register_modena_tracking_rest_routes() {
    register_rest_route('modena/v1', '/track-event', array(
        'methods'             => 'POST',
        'callback'            => 'modena_handle_track_event_rest',
        'permission_callback' => '__return_true'
    ));

    register_rest_route('modena/v1', '/facebook-catalog-feed', array(
        'methods'             => 'GET',
        'callback'            => 'modena_facebook_catalog_feed_handler',
        'permission_callback' => '__return_true'
    ));

    register_rest_route('modena/v1', '/google-merchant-feed', array(
        'methods'             => 'GET',
        'callback'            => 'modena_google_merchant_feed_handler',
        'permission_callback' => '__return_true'
    ));

    register_rest_route('modena/v1', '/xml-sitemap', array(
        'methods'             => 'GET',
        'callback'            => 'modena_xml_sitemap_handler',
        'permission_callback' => '__return_true'
    ));
}
add_action('rest_api_init', 'register_modena_tracking_rest_routes');

function modena_handle_track_event_rest($request) {
    $params = $request->get_json_params();
    if (!is_array($params)) {
        $params = $request->get_params();
    }

    $event_name  = isset($params['event_name']) ? sanitize_text_field($params['event_name']) : '';
    $event_id    = isset($params['event_id']) ? sanitize_text_field($params['event_id']) : ('evt_' . time() . rand(1000, 9999));
    $custom_data = isset($params['custom_data']) && is_array($params['custom_data']) ? $params['custom_data'] : array();
    $user_data   = isset($params['user_data']) && is_array($params['user_data']) ? $params['user_data'] : array();

    if (empty($event_name)) {
        return new WP_Error('missing_event_name', 'Event name is required', array('status' => 400));
    }

    $success = modena_send_meta_capi_event($event_name, $event_id, $custom_data, $user_data);

    return rest_ensure_response(array(
        'success'    => true,
        'event_name' => $event_name,
        'event_id'   => $event_id,
        'capi_sent'  => $success
    ));
}

function modena_facebook_catalog_feed_handler($request) {
    if (!class_exists('WooCommerce')) {
        return new WP_Error('no_woocommerce', 'WooCommerce is required', array('status' => 500));
    }

    $args = array(
        'post_type'      => 'product',
        'posts_per_page' => 500,
        'post_status'    => 'publish'
    );
    $products = get_posts($args);
    $catalog  = array();

    foreach ($products as $post) {
        $product = wc_get_product($post->ID);
        if (!$product) continue;

        $image_id  = $product->get_image_id();
        $image_url = $image_id ? wp_get_attachment_image_url($image_id, 'full') : '';
        $gtin      = get_post_meta($product->get_id(), '_gtin', true);

        $catalog[] = array(
            'id'           => (string) $product->get_id(),
            'title'        => $product->get_name(),
            'description'  => wp_strip_all_tags($product->get_description() ?: $product->get_short_description()),
            'link'         => get_permalink($product->get_id()),
            'image_link'   => $image_url,
            'price'        => $product->get_price() . ' INR',
            'availability' => $product->is_in_stock() ? 'in stock' : 'out of stock',
            'brand'        => 'Modena Kitchenware',
            'gtin'         => $gtin ?: '',
            'condition'    => 'new'
        );
    }

    return rest_ensure_response(array(
        'success'  => true,
        'count'    => count($catalog),
        'products' => $catalog
    ));
}


// --- 2. GOOGLE MERCHANT CENTER (GTIN + DOMAIN VERIFICATION + RSS XML FEED) ---

function modena_add_gtin_product_field() {
    echo '<div class="options_group">';
    woocommerce_wp_text_input(array(
        'id'          => '_gtin',
        'label'       => __('GTIN / EAN / Barcode', 'woocommerce'),
        'placeholder' => 'e.g. 8901234567890',
        'desc_tip'    => 'true',
        'description' => __('Enter the Global Trade Item Number (GTIN/EAN) for Google Merchant Center.', 'woocommerce')
    ));
    echo '</div>';
}
add_action('woocommerce_product_options_general_product_data', 'modena_add_gtin_product_field');

function modena_save_gtin_product_field($post_id) {
    $gtin = isset($_POST['_gtin']) ? sanitize_text_field($_POST['_gtin']) : '';
    update_post_meta($post_id, '_gtin', $gtin);
}
add_action('woocommerce_process_product_meta', 'modena_save_gtin_product_field');

function modena_expose_gtin_in_rest_api($response, $object, $request) {
    if (isset($response->data)) {
        $gtin = get_post_meta($object->get_id(), '_gtin', true);
        $response->data['gtin'] = $gtin ?: null;
    }
    return $response;
}
add_filter('woocommerce_rest_prepare_product_object', 'modena_expose_gtin_in_rest_api', 10, 3);

function modena_inject_google_site_verification() {
    $verification_code = defined('GOOGLE_SITE_VERIFICATION') ? GOOGLE_SITE_VERIFICATION : get_option('google_site_verification', '');
    if (!empty($verification_code)) {
        echo '<meta name="google-site-verification" content="' . esc_attr($verification_code) . '" />' . "\n";
    }
}
add_action('wp_head', 'modena_inject_google_site_verification', 2);

function modena_google_merchant_feed_handler($request) {
    if (!class_exists('WooCommerce')) {
        return new WP_Error('no_woocommerce', 'WooCommerce is required', array('status' => 500));
    }

    header('Content-Type: application/xml; charset=utf-8');

    $args = array(
        'post_type'      => 'product',
        'posts_per_page' => 500,
        'post_status'    => 'publish'
    );
    $products = get_posts($args);

    $xml = new SimpleXMLElement('<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0"/>');
    $channel = $xml->addChild('channel');
    $channel->addChild('title', 'Modena Kitchenware Product Feed');
    $channel->addChild('link', home_url());
    $channel->addChild('description', 'Heritage-Grade Culinary Tools & Kitchenware Product Feed');

    foreach ($products as $post) {
        $product = wc_get_product($post->ID);
        if (!$product) continue;

        $item = $channel->addChild('item');
        $item->addChild('g:id', (string) $product->get_id(), 'http://base.google.com/ns/1.0');
        $item->addChild('g:title', htmlspecialchars($product->get_name(), ENT_XML1, 'UTF-8'), 'http://base.google.com/ns/1.0');
        $item->addChild('g:description', htmlspecialchars(wp_strip_all_tags($product->get_description() ?: $product->get_short_description()), ENT_XML1, 'UTF-8'), 'http://base.google.com/ns/1.0');
        $item->addChild('g:link', get_permalink($product->get_id()), 'http://base.google.com/ns/1.0');

        $image_id = $product->get_image_id();
        if ($image_id) {
            $image_url = wp_get_attachment_image_url($image_id, 'full');
            if ($image_url) {
                $item->addChild('g:image_link', esc_url($image_url), 'http://base.google.com/ns/1.0');
            }
        }

        $price_val = (float) ($product->get_price() ?: 0);
        $item->addChild('g:availability', $product->is_in_stock() ? 'in stock' : 'out of stock', 'http://base.google.com/ns/1.0');
        $item->addChild('g:price', number_format($price_val, 2, '.', '') . ' INR', 'http://base.google.com/ns/1.0');
        $item->addChild('g:brand', 'Modena Kitchenware', 'http://base.google.com/ns/1.0');
        $item->addChild('g:condition', 'new', 'http://base.google.com/ns/1.0');

        $gtin = get_post_meta($product->get_id(), '_gtin', true);
        if (!empty($gtin)) {
            $item->addChild('g:gtin', htmlspecialchars($gtin, ENT_XML1, 'UTF-8'), 'http://base.google.com/ns/1.0');
            $item->addChild('g:identifier_exists', 'yes', 'http://base.google.com/ns/1.0');
        } else {
            $item->addChild('g:identifier_exists', 'no', 'http://base.google.com/ns/1.0');
        }
    }

    echo $xml->asXML();
    exit;
}


// --- 3. SEO + SCHEMA: DYNAMIC OPENGRAPH, CANONICAL LINKS & PRODUCT JSON-LD ---

function modena_inject_dynamic_seo_head() {
    $site_name = get_bloginfo('name') ?: 'Modena Kitchenware';
    $site_desc = get_bloginfo('description') ?: 'Heritage-Grade Culinary Tools & Kitchenware';
    $title     = $site_name . ' — ' . $site_desc;
    $canonical = home_url($_SERVER['REQUEST_URI'] ?? '');
    $og_type   = 'website';
    $og_image  = get_template_directory_uri() . '/public/modena_hero_banner.jpg';
    $og_desc   = 'Discover Modena Heritage-Grade Tri-Ply Stainless Steel, Cast Iron Cookware and Heavy Duty Mixer Grinders.';

    if (is_product() || (isset($_GET['product_id']) && intval($_GET['product_id']) > 0)) {
        $product_id = is_product() ? get_the_ID() : intval($_GET['product_id']);
        $product    = wc_get_product($product_id);

        if ($product) {
            $title    = $product->get_name() . ' — Modena Kitchenware';
            $og_desc  = wp_strip_all_tags($product->get_short_description() ?: $product->get_description());
            $og_type  = 'product';
            $image_id = $product->get_image_id();
            if ($image_id) {
                $og_image = wp_get_attachment_image_url($image_id, 'full');
            }
        }
    }

    echo '<title>' . esc_html($title) . '</title>' . "\n";
    echo '<link rel="canonical" href="' . esc_url($canonical) . '" />' . "\n";
    echo '<meta name="description" content="' . esc_attr(mb_strimwidth($og_desc, 0, 160, '...')) . '" />' . "\n";
    echo '<meta property="og:site_name" content="' . esc_attr($site_name) . '" />' . "\n";
    echo '<meta property="og:type" content="' . esc_attr($og_type) . '" />' . "\n";
    echo '<meta property="og:title" content="' . esc_attr($title) . '" />' . "\n";
    echo '<meta property="og:description" content="' . esc_attr(mb_strimwidth($og_desc, 0, 200, '...')) . '" />' . "\n";
    echo '<meta property="og:image" content="' . esc_url($og_image) . '" />' . "\n";
    echo '<meta property="og:url" content="' . esc_url($canonical) . '" />' . "\n";
    echo '<meta name="twitter:card" content="summary_large_image" />' . "\n";
    echo '<meta name="twitter:title" content="' . esc_attr($title) . '" />' . "\n";
    echo '<meta name="twitter:description" content="' . esc_attr(mb_strimwidth($og_desc, 0, 160, '...')) . '" />' . "\n";
    echo '<meta name="twitter:image" content="' . esc_url($og_image) . '" />' . "\n";
}
add_action('wp_head', 'modena_inject_dynamic_seo_head', 3);

function modena_inject_product_json_ld_schema() {
    if (!class_exists('WooCommerce')) return;

    $product_id = 0;
    if (is_product()) {
        $product_id = get_the_ID();
    } elseif (isset($_GET['product_id'])) {
        $product_id = intval($_GET['product_id']);
    }

    if (!$product_id) return;

    $product = wc_get_product($product_id);
    if (!$product) return;

    $image_id  = $product->get_image_id();
    $image_url = $image_id ? wp_get_attachment_image_url($image_id, 'full') : '';
    $gtin      = get_post_meta($product->get_id(), '_gtin', true);

    $schema = array(
        '@context'    => 'https://schema.org/',
        '@type'       => 'Product',
        'name'        => $product->get_name(),
        'image'       => array($image_url),
        'description' => wp_strip_all_tags($product->get_description() ?: $product->get_short_description()),
        'sku'         => $product->get_sku() ?: (string) $product->get_id(),
        'brand'       => array(
            '@type' => 'Brand',
            'name'  => 'Modena Kitchenware'
        ),
        'offers'      => array(
            '@type'         => 'Offer',
            'url'           => get_permalink($product->get_id()),
            'priceCurrency' => 'INR',
            'price'         => number_format($product->get_price(), 2, '.', ''),
            'availability'  => $product->is_in_stock() ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            'seller'        => array(
                '@type' => 'Organization',
                'name'  => 'Modena Kitchenware'
            )
        )
    );

    if (!empty($gtin)) {
        $schema['gtin'] = $gtin;
    }

    if ($product->get_rating_count() > 0) {
        $schema['aggregateRating'] = array(
            '@type'       => 'AggregateRating',
            'ratingValue' => $product->get_average_rating(),
            'reviewCount' => $product->get_rating_count()
        );
    }

    echo '<script type="application/ld+json" id="modena-product-schema">' . "\n";
    echo json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . "\n";
    echo '</script>' . "\n";
}
add_action('wp_head', 'modena_inject_product_json_ld_schema', 4);

function modena_xml_sitemap_handler($request) {
    header('Content-Type: application/xml; charset=utf-8');

    $xml = new SimpleXMLElement('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>');

    $url = $xml->addChild('url');
    $url->addChild('loc', home_url());
    $url->addChild('changefreq', 'daily');
    $url->addChild('priority', '1.0');

    $products = get_posts(array(
        'post_type'      => 'product',
        'posts_per_page' => 500,
        'post_status'    => 'publish'
    ));

    foreach ($products as $post) {
        $url = $xml->addChild('url');
        $url->addChild('loc', get_permalink($post->ID));
        $url->addChild('lastmod', date('Y-m-d', strtotime($post->post_modified)));
        $url->addChild('changefreq', 'weekly');
        $url->addChild('priority', '0.8');
    }

    $categories = get_terms(array(
        'taxonomy'   => 'product_cat',
        'hide_empty' => false
    ));

    if (!is_wp_error($categories)) {
        foreach ($categories as $cat) {
            $url = $xml->addChild('url');
            $url->addChild('loc', get_term_link($cat));
            $url->addChild('changefreq', 'weekly');
            $url->addChild('priority', '0.6');
        }
    }

    echo $xml->asXML();
    exit;
}

// =============================================================================
// MODENA REACT THEME SYNC & CLEANUP
// =============================================================================

// 1. Enqueue required Google Fonts and Material Icons for visual parity
function modena_enqueue_fonts_and_icons() {
    wp_enqueue_style('modena-google-fonts', 'https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@400;500;600;700&family=Roboto+Condensed:ital,wght@0,100..900;1,100..900&display=swap', array(), null);
    wp_enqueue_style('modena-material-icons', 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap', array(), null);
}
add_action('wp_enqueue_scripts', 'modena_enqueue_fonts_and_icons');

// 2. Remove default WordPress styles that interfere with Tailwind CSS
function modena_dequeue_default_styles() {
    wp_dequeue_style('wp-block-library');
    wp_dequeue_style('wp-block-library-theme');
    wp_dequeue_style('wc-blocks-style'); 
    wp_dequeue_style('classic-theme-styles');
    wp_dequeue_style('global-styles');
}
add_action('wp_enqueue_scripts', 'modena_dequeue_default_styles', 100);

// 3. Disable frontend admin bar to prevent layout shifts and margin-top overrides
add_filter('show_admin_bar', '__return_false');

// =============================================================================
// MODENA PRODUCT SPECIFICATIONS & DETAILS (ADMIN META BOX & REST API)
// =============================================================================

/**
 * Register Product Specifications Meta Box in WooCommerce Product Editor
 */
add_action('add_meta_boxes', 'modena_register_product_specs_meta_box');
function modena_register_product_specs_meta_box() {
    add_meta_box(
        'modena_product_specs_box',
        __('Modena Product Specifications & Details', 'modena'),
        'modena_render_product_specs_meta_box',
        'product',
        'normal',
        'high'
    );
}

function modena_render_product_specs_meta_box($post) {
    wp_nonce_field('modena_save_product_specs', 'modena_product_specs_nonce');

    $included_components = get_post_meta($post->ID, '_modena_included_components', true);
    if (is_array($included_components)) {
        $included_components = implode("\n", $included_components);
    }

    $usp = get_post_meta($post->ID, '_modena_usp', true);
    if (is_array($usp)) {
        $usp = implode("\n", $usp);
    }

    $dimensions = get_post_meta($post->ID, '_modena_dimensions', true);
    $manufacturer = get_post_meta($post->ID, '_modena_manufacturer', true);
    ?>
    <style>
        .modena-specs-field { margin-bottom: 20px; }
        .modena-specs-field label { display: block; font-weight: 600; font-size: 13px; margin-bottom: 6px; color: #1d2327; }
        .modena-specs-field .description { font-size: 12px; color: #646970; margin-top: 4px; }
        .modena-specs-field textarea, .modena-specs-field input[type="text"] { width: 100%; border: 1px solid #8c8f94; border-radius: 4px; padding: 8px 12px; font-size: 13px; }
    </style>
    <div class="modena-product-specs-wrapper">
        <p style="margin-bottom: 15px; color: #50575e; font-size: 13px;">
            Enter the structured product specifications below. These fields automatically synchronize with the React frontend product details accordions in the exact order: <strong>Description &rarr; Included Components &rarr; USP &rarr; Dimensions &rarr; Manufacturer</strong>.
        </p>

        <!-- 1. Included Components -->
        <div class="modena-specs-field">
            <label for="modena_included_components">1. Included Components</label>
            <textarea id="modena_included_components" name="modena_included_components" rows="5" placeholder="Enter each included component on a new line (e.g. 1x Motor Base, 1x 550ml Jar, 1x Travel Lid)"><?php echo esc_textarea($included_components); ?></textarea>
            <p class="description">Enter package contents or included accessories. Each line will be formatted into an itemized component list on the frontend.</p>
        </div>

        <!-- 2. USP -->
        <div class="modena-specs-field">
            <label for="modena_usp">2. USP (Unique Selling Points)</label>
            <textarea id="modena_usp" name="modena_usp" rows="6" placeholder="Enter each key USP point on a new line (e.g. Powerful 990W Copper Motor, Durable Tri-Ply Stainless Steel)"><?php echo esc_textarea($usp); ?></textarea>
            <p class="description">Enter unique selling points. Each line will be displayed as a feature bullet point on the frontend.</p>
        </div>

        <!-- 3. Dimensions -->
        <div class="modena-specs-field">
            <label for="modena_dimensions">3. Dimensions</label>
            <textarea id="modena_dimensions" name="modena_dimensions" rows="3" placeholder="e.g. Blending Jar: 550ml (Dia: 75mm) | Base Width: 120mm | Height: 345mm"><?php echo esc_textarea($dimensions); ?></textarea>
            <p class="description">Enter measurements, size dimensions, capacity, or weight specifications.</p>
        </div>

        <!-- 4. Manufacturer -->
        <div class="modena-specs-field">
            <label for="modena_manufacturer">4. Manufacturer</label>
            <input type="text" id="modena_manufacturer" name="modena_manufacturer" value="<?php echo esc_attr($manufacturer); ?>" placeholder="e.g. Modena Kitchenware" />
            <p class="description">Enter brand, origin, or manufacturer name.</p>
        </div>
    </div>
    <?php
}

/**
 * Save Product Specifications Meta Box
 */
add_action('save_post_product', 'modena_save_product_specs_meta_box', 10, 2);
add_action('woocommerce_process_product_meta', 'modena_save_product_specs_meta_box', 10, 2);
function modena_save_product_specs_meta_box($post_id, $post = null) {
    if (!isset($_POST['modena_product_specs_nonce']) || !wp_verify_nonce($_POST['modena_product_specs_nonce'], 'modena_save_product_specs')) {
        return;
    }

    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }

    if (!current_user_can('edit_post', $post_id)) {
        return;
    }

    // 1. Included Components
    if (isset($_POST['modena_included_components'])) {
        $raw_inc = sanitize_textarea_field($_POST['modena_included_components']);
        $inc_lines = array_values(array_filter(array_map('trim', explode("\n", $raw_inc))));
        update_post_meta($post_id, '_modena_included_components', $inc_lines);
    }

    // 2. USP
    if (isset($_POST['modena_usp'])) {
        $raw_usp = sanitize_textarea_field($_POST['modena_usp']);
        $usp_lines = array_values(array_filter(array_map('trim', explode("\n", $raw_usp))));
        update_post_meta($post_id, '_modena_usp', $usp_lines);
    }

    // 3. Dimensions
    if (isset($_POST['modena_dimensions'])) {
        update_post_meta($post_id, '_modena_dimensions', sanitize_textarea_field($_POST['modena_dimensions']));
    }

    // 4. Manufacturer
    if (isset($_POST['modena_manufacturer'])) {
        update_post_meta($post_id, '_modena_manufacturer', sanitize_text_field($_POST['modena_manufacturer']));
    }

    // Delete legacy 'more' meta if present
    delete_post_meta($post_id, '_modena_more');
}

/**
 * Expose Product Specifications in WooCommerce Store API (/wp-json/wc/store/v1/products)
 */
add_action('woocommerce_store_api_register_endpoint_data', function() {
    if (function_exists('woocommerce_store_api_register_endpoint_data')) {
        woocommerce_store_api_register_endpoint_data([
            'endpoint'        => 'products',
            'namespace'       => 'modena',
            'data_callback'   => function($product) {
                $post_id = $product->get_id();
                $inc = maybe_unserialize(get_post_meta($post_id, '_modena_included_components', true));
                $usp = maybe_unserialize(get_post_meta($post_id, '_modena_usp', true));
                $dims = get_post_meta($post_id, '_modena_dimensions', true);
                $mfr = get_post_meta($post_id, '_modena_manufacturer', true);

                return [
                    'included_components' => is_array($inc) ? array_values(array_filter($inc)) : (empty($inc) ? [] : array_values(array_filter(array_map('trim', explode("\n", $inc))))),
                    'usp'                 => is_array($usp) ? array_values(array_filter($usp)) : (empty($usp) ? [] : array_values(array_filter(array_map('trim', explode("\n", $usp))))),
                    'dimensions'          => is_string($dims) ? trim($dims) : '',
                    'manufacturer'        => is_string($mfr) ? trim($mfr) : 'Modena Kitchenware'
                ];
            },
            'schema_callback' => function() {
                return [
                    'included_components' => ['type' => 'array'],
                    'usp'                 => ['type' => 'array'],
                    'dimensions'          => ['type' => 'string'],
                    'manufacturer'        => ['type' => 'string']
                ];
            },
            'schema_type'     => ARRAY_A,
        ]);
    }
});

/**
 * Register fields for standard WP REST API and WooCommerce v3 API
 */
add_action('rest_api_init', function() {
    register_rest_field('product', 'modena_specs', [
        'get_callback' => function($product_arr) {
            $post_id = $product_arr['id'];
            $inc = maybe_unserialize(get_post_meta($post_id, '_modena_included_components', true));
            $usp = maybe_unserialize(get_post_meta($post_id, '_modena_usp', true));
            $dims = get_post_meta($post_id, '_modena_dimensions', true);
            $mfr = get_post_meta($post_id, '_modena_manufacturer', true);

            return [
                'included_components' => is_array($inc) ? array_values(array_filter($inc)) : (empty($inc) ? [] : array_values(array_filter(array_map('trim', explode("\n", $inc))))),
                'usp'                 => is_array($usp) ? array_values(array_filter($usp)) : (empty($usp) ? [] : array_values(array_filter(array_map('trim', explode("\n", $usp))))),
                'dimensions'          => is_string($dims) ? trim($dims) : '',
                'manufacturer'        => is_string($mfr) ? trim($mfr) : 'Modena Kitchenware'
            ];
        },
        'schema' => null,
    ]);

    // Dedicated endpoint for all product specs
    register_rest_route('modena/v1', '/products-specs', [
        'methods'             => 'GET',
        'callback'            => function() {
            $products = wc_get_products(['limit' => -1]);
            $out = [];
            foreach ($products as $p) {
                $pid = $p->get_id();
                $inc = maybe_unserialize(get_post_meta($pid, '_modena_included_components', true));
                $usp = maybe_unserialize(get_post_meta($pid, '_modena_usp', true));
                $dims = get_post_meta($pid, '_modena_dimensions', true);
                $mfr = get_post_meta($pid, '_modena_manufacturer', true);

                $out[$pid] = [
                    'id'                  => $pid,
                    'slug'                => $p->get_slug(),
                    'name'                => $p->get_name(),
                    'description'         => $p->get_description(),
                    'short_description'   => $p->get_short_description(),
                    'included_components' => is_array($inc) ? array_values(array_filter($inc)) : (empty($inc) ? [] : array_values(array_filter(array_map('trim', explode("\n", $inc))))),
                    'usp'                 => is_array($usp) ? array_values(array_filter($usp)) : (empty($usp) ? [] : array_values(array_filter(array_map('trim', explode("\n", $usp))))),
                    'dimensions'          => is_string($dims) ? trim($dims) : '',
                    'manufacturer'        => is_string($mfr) ? trim($mfr) : 'Modena Kitchenware'
                ];
            }
            return rest_ensure_response($out);
        },
        'permission_callback' => '__return_true'
    ]);
});

/**
 * Modena Product Management & Custom CSV Importer Module
 */
require_once get_template_directory() . '/inc/modena-product-importer.php';
?>
