<?php
/**
 * Modena Custom Product Management & CSV Importer with Column Mapping
 * 
 * Supports:
 * - Direct Base64 Data URIs (data:image/png;base64,...), Raw Base64 strings,
 *   HTTP/HTTPS URLs, Local file paths, and relative paths.
 * - High-speed Server-side Session Caching for giant CSVs (100MB - 500MB+).
 * - Live upload transfer meter (MB/s & Mbps).
 * - Safe sequential batch importing into WooCommerce.
 */

if (!defined('ABSPATH')) {
    exit;
}

@ini_set('memory_limit', '1024M');
@ini_set('max_execution_time', '600');
@ini_set('upload_max_filesize', '500M');
@ini_set('post_max_size', '500M');
@set_time_limit(600);

class Modena_Product_Importer {

    const TARGET_FIELDS = [
        'name'                => ['label' => 'Product Name', 'required' => true, 'desc' => 'Primary product title'],
        'category'            => ['label' => 'Categories', 'required' => false, 'desc' => 'Category (Mixer Grinder, Nutrimix, or Cookware)'],
        'sku'                 => ['label' => 'SKU (Product Code)', 'required' => false, 'desc' => 'Unique product inventory code'],
        'regular_price'       => ['label' => 'Regular Price', 'required' => false, 'desc' => 'Standard retail price in INR (numbers only)'],
        'sale_price'          => ['label' => 'Sale Price', 'required' => false, 'desc' => 'Discounted price (must be <= Regular price)'],
        'stock_status'        => ['label' => 'Stock Status', 'required' => false, 'desc' => 'Stock availability (instock or outofstock)'],
        'image_1'             => ['label' => 'Image 1 (Featured Image)', 'required' => false, 'desc' => 'Base64, URL, or local file path'],
        'image_2'             => ['label' => 'Image 2 (Gallery)', 'required' => false, 'desc' => 'Base64, URL, or local file path'],
        'image_3'             => ['label' => 'Image 3 (Gallery)', 'required' => false, 'desc' => 'Base64, URL, or local file path'],
        'image_4'             => ['label' => 'Image 4 (Gallery)', 'required' => false, 'desc' => 'Base64, URL, or local file path'],
        'image_5'             => ['label' => 'Image 5 (Gallery)', 'required' => false, 'desc' => 'Base64, URL, or local file path'],
        'short_description'   => ['label' => 'Short Description', 'required' => false, 'desc' => 'Brief 1-2 sentence summary'],
        'description'         => ['label' => 'Product Description', 'required' => false, 'desc' => 'Full detailed overview paragraph'],
        'included_components' => ['included_components', 'desc' => 'Package contents (newline or | separated)'],
        'usp'                 => ['label' => 'USP (Unique Selling Points)', 'required' => false, 'desc' => 'Key bullet points (newline or | separated)'],
        'dimension'           => ['label' => 'Dimensions & Specs', 'required' => false, 'desc' => 'Measurements, capacity, or size text'],
        'manufacturer'        => ['label' => 'Manufacturer / Brand', 'required' => false, 'desc' => 'Brand or manufacturer name']
    ];

    public static function init() {
        add_action('admin_menu', [__CLASS__, 'register_admin_menu']);
        add_action('admin_post_modena_download_blank_template', [__CLASS__, 'download_blank_template']);
        add_action('admin_post_modena_download_example_template', [__CLASS__, 'download_example_template']);
        add_action('admin_post_modena_empty_product_trash', [__CLASS__, 'admin_empty_product_trash']);
        add_action('wp_ajax_modena_parse_csv_headers', [__CLASS__, 'ajax_parse_csv_headers']);
        add_action('wp_ajax_modena_validate_mapped_csv', [__CLASS__, 'ajax_validate_mapped_csv']);
        add_action('wp_ajax_modena_process_import_batch', [__CLASS__, 'ajax_process_import_batch']);
    }

    public static function register_admin_menu() {
        add_submenu_page(
            'edit.php?post_type=product',
            __('Modena Product Importer', 'modena'),
            __('Modena Importer', 'modena'),
            'manage_woocommerce',
            'modena-product-importer',
            [__CLASS__, 'render_admin_page']
        );
    }

    public static function admin_empty_product_trash() {
        if (!current_user_can('manage_woocommerce')) {
            wp_die(__('Unauthorized access', 'modena'));
        }
        check_admin_referer('modena_empty_trash');

        $trashed_products = get_posts([
            'post_type' => 'product',
            'post_status' => 'trash',
            'posts_per_page' => -1,
            'fields' => 'ids'
        ]);

        $deleted_count = 0;
        foreach ($trashed_products as $pid) {
            if (wp_delete_post($pid, true)) {
                $deleted_count++;
            }
        }

        if (function_exists('wc_delete_product_transients')) {
            wc_delete_product_transients();
        }

        wp_safe_redirect(add_query_arg(['trash_emptied' => $deleted_count], admin_url('edit.php?post_type=product&page=modena-product-importer')));
        exit;
    }

    public static function download_blank_template() {
        if (!current_user_can('manage_woocommerce')) {
            wp_die(__('Unauthorized access', 'modena'));
        }
        check_admin_referer('modena_download_template');

        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename=modena-product-import-template.csv');
        header('Pragma: no-cache');
        header('Expires: 0');

        $output = fopen('php://output', 'w');
        fputs($output, "\xEF\xBB\xBF");
        fputcsv($output, array_keys(self::TARGET_FIELDS));
        fclose($output);
        exit;
    }

    public static function download_example_template() {
        if (!current_user_can('manage_woocommerce')) {
            wp_die(__('Unauthorized access', 'modena'));
        }
        check_admin_referer('modena_download_example');

        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename=modena-product-import-example.csv');
        header('Pragma: no-cache');
        header('Expires: 0');

        $output = fopen('php://output', 'w');
        fputs($output, "\xEF\xBB\xBF");
        fputcsv($output, array_keys(self::TARGET_FIELDS));

        // Example Row 1: Blender
        fputcsv($output, [
            'Modena Blender (Silver/Black)',
            'Mixer Grinder',
            'MOD-BLD-01',
            '3999',
            '2999',
            'instock',
            'http://modena.local/wp-content/themes/modena-react-theme/catalog_assets/product_1_img_1.jpeg',
            'http://modena.local/wp-content/themes/modena-react-theme/catalog_assets/product_1_img_2.jpeg',
            'http://modena.local/wp-content/themes/modena-react-theme/catalog_assets/product_1_img_3.png',
            'http://modena.local/wp-content/themes/modena-react-theme/catalog_assets/product_1_img_4.jpeg',
            '',
            'A versatile, powerful high-speed blender designed for effortless smoothies and dry grinding.',
            'Engineered for modern kitchens, the Modena Blender is a compact and space-saving solution for all your blending needs with high-speed motor and polycarbonate jars.',
            "1x Motor Base\n1x 550ml Blending Jar\n1x 350ml Grinding Cup\n1x Travel Lid",
            "Powerful High-Speed Motor\nBPA-free Unbreakable Jars\nLeak-Proof Travel Lid\nOne-Touch Operation",
            'Total Height 345mm, Base Width 120mm',
            'Modena Kitchenware'
        ]);

        // Example Row 2: Cookware
        fputcsv($output, [
            'TriPro 4 Pcs Tri-Ply Stainless Steel Cookware Set',
            'Cookware',
            'BER-TRIPRO-01',
            '5999',
            '4499',
            'instock',
            'http://modena.local/wp-content/themes/modena-react-theme/catalog_assets/product_3_img_1.jpeg',
            'http://modena.local/wp-content/themes/modena-react-theme/catalog_assets/product_3_img_2.jpeg',
            'http://modena.local/wp-content/themes/modena-react-theme/catalog_assets/product_3_img_3.png',
            '',
            '',
            'A premium 4-piece tri-ply stainless steel cookware set designed for even heating and everyday cooking.',
            'Crafted from high-quality tri-ply stainless steel, this collection guarantees superior heat conduction and distribution, eliminating hot spots.',
            "1x 22cm Kadai (2L)\n1x 22cm Frypan (1L)\n1x 14cm Teapan (1L)\n1x Stainless Steel Lid",
            "Tri-ply construction for rapid heat distribution\nRequires less oil for healthy cooking\nInduction bottom compatible",
            'Kadai 22cm, Frypan 22cm, Teapan 14cm',
            'Bergner'
        ]);

        fclose($output);
        exit;
    }

    /**
     * AJAX 1: Parse CSV Headers and Truncated Sample Rows for Fast UI Response
     */
    public static function ajax_parse_csv_headers() {
        @ini_set('memory_limit', '1024M');
        @set_time_limit(600);

        check_ajax_referer('modena_importer_nonce', 'security');

        if (!current_user_can('manage_woocommerce')) {
            wp_send_json_error(['message' => __('Unauthorized permission.', 'modena')]);
        }

        if (empty($_FILES['csv_file']['tmp_name'])) {
            wp_send_json_error(['message' => __('Please select a valid CSV file.', 'modena')]);
        }

        $wp_upload_dir = wp_upload_dir();
        $temp_filename = 'modena_import_' . wp_generate_password(12, false) . '.csv';
        $temp_filepath = $wp_upload_dir['basedir'] . '/' . $temp_filename;

        if (!move_uploaded_file($_FILES['csv_file']['tmp_name'], $temp_filepath)) {
            wp_send_json_error(['message' => __('Failed to store temporary upload file.', 'modena')]);
        }

        $handle = fopen($temp_filepath, 'r');
        if (!$handle) {
            wp_send_json_error(['message' => __('Unable to read uploaded file.', 'modena')]);
        }

        $raw_headers = fgetcsv($handle);
        if (!$raw_headers) {
            fclose($handle);
            @unlink($temp_filepath);
            wp_send_json_error(['message' => __('The uploaded CSV file is empty.', 'modena')]);
        }

        $headers = [];
        foreach ($raw_headers as $idx => $h) {
            $cleaned = preg_replace('/^\xEF\xBB\xBF/', '', trim($h));
            $headers[] = [
                'index' => $idx,
                'name'  => $cleaned
            ];
        }

        $sample_rows = [];
        $count = 0;
        while (($row = fgetcsv($handle)) !== false && $count < 2) {
            if (!empty(array_filter($row, 'strlen'))) {
                // Truncate large Base64 strings in sample rows so JSON response is lightweight and instant
                $clean_sample = array_map(function($val) {
                    $val = trim($val);
                    if (strpos($val, 'data:image') === 0) {
                        return '[Base64 Image Data ~' . round(strlen($val) / 1024) . ' KB]';
                    }
                    if (strlen($val) > 100) {
                        return substr($val, 0, 97) . '...';
                    }
                    return $val;
                }, $row);

                $sample_rows[] = $clean_sample;
                $count++;
            }
        }
        fclose($handle);

        $auto_mapping = [];
        $alias_map = [
            'name'                => ['name', 'title', 'product name', 'product_name', 'item name', 'product title'],
            'category'            => ['category', 'categories', 'product_cat', 'cat', 'cats', 'type'],
            'sku'                 => ['sku', 'item code', 'product code', 'id', 'item_code'],
            'regular_price'       => ['regular_price', 'regular price', 'price', 'mrp', 'standard price', 'cost'],
            'sale_price'          => ['sale_price', 'sale price', 'discount price', 'deal price', 'offer price'],
            'stock_status'        => ['stock_status', 'stock', 'inventory', 'availability', 'in stock?'],
            'image_1'             => ['image_1', 'image 1', 'featured image', 'photo 1', 'main image', 'image', 'images'],
            'image_2'             => ['image_2', 'image 2', 'gallery 1', 'photo 2', 'gallery image 1'],
            'image_3'             => ['image_3', 'image 3', 'gallery 2', 'photo 3', 'gallery image 2'],
            'image_4'             => ['image_4', 'image 4', 'gallery 3', 'photo 4', 'gallery image 3'],
            'image_5'             => ['image_5', 'image 5', 'gallery 4', 'photo 5', 'gallery image 4'],
            'short_description'   => ['short_description', 'short description', 'summary', 'excerpt'],
            'description'         => ['description', 'desc', 'full description', 'overview', 'details'],
            'included_components' => ['included_components', 'components', 'included', 'in the box', 'box contents', 'package contents'],
            'usp'                 => ['usp', 'usps', 'bullet points', 'features', 'key features', 'highlights'],
            'dimension'           => ['dimension', 'dimensions', 'specs', 'measurements', 'size'],
            'manufacturer'        => ['manufacturer', 'brand', 'vendor', 'maker', 'origin']
        ];

        foreach (self::TARGET_FIELDS as $field_key => $finfo) {
            $matched_col = -1;
            $aliases = $alias_map[$field_key] ?? [$field_key];

            foreach ($headers as $h) {
                $h_clean = strtolower(str_replace(['_', '-', ' '], '', $h['name']));
                foreach ($aliases as $alias) {
                    $a_clean = strtolower(str_replace(['_', '-', ' '], '', $alias));
                    if ($h_clean === $a_clean) {
                        $matched_col = $h['index'];
                        break 2;
                    }
                }
            }
            $auto_mapping[$field_key] = $matched_col;
        }

        wp_send_json_success([
            'temp_filename' => $temp_filename,
            'headers'       => $headers,
            'sample_rows'   => $sample_rows,
            'target_fields' => self::TARGET_FIELDS,
            'auto_mapping'  => $auto_mapping
        ]);
    }

    /**
     * AJAX 2: Validate CSV & Store Session on Server for Ultra-Fast Processing
     */
    public static function ajax_validate_mapped_csv() {
        @ini_set('memory_limit', '1024M');
        @set_time_limit(600);

        check_ajax_referer('modena_importer_nonce', 'security');

        if (!current_user_can('manage_woocommerce')) {
            wp_send_json_error(['message' => __('Unauthorized permission.', 'modena')]);
        }

        $temp_filename = sanitize_file_name($_POST['temp_filename'] ?? '');
        $mapping = isset($_POST['mapping']) ? json_decode(stripslashes($_POST['mapping']), true) : [];

        if (empty($temp_filename) || empty($mapping)) {
            wp_send_json_error(['message' => __('Invalid validation parameters or mapping.', 'modena')]);
        }

        $wp_upload_dir = wp_upload_dir();
        $file_path = $wp_upload_dir['basedir'] . '/' . $temp_filename;

        if (!file_exists($file_path)) {
            wp_send_json_error(['message' => __('Temporary upload file expired. Please re-upload your CSV.', 'modena')]);
        }

        $handle = fopen($file_path, 'r');
        if (!$handle) {
            wp_send_json_error(['message' => __('Unable to open upload file for validation.', 'modena')]);
        }

        // Skip header
        fgetcsv($handle);

        $name_col = isset($mapping['name']) ? intval($mapping['name']) : -1;
        if ($name_col < 0) {
            fclose($handle);
            wp_send_json_error(['message' => __('Product Name column must be mapped.', 'modena')]);
        }

        $server_products = [];
        $client_preview_rows = [];
        $errors = [];
        $row_index = 1;

        while (($data = fgetcsv($handle)) !== false) {
            $row_index++;

            if (empty(array_filter($data, 'strlen'))) {
                continue;
            }

            $get_mapped = function($key) use ($data, $mapping) {
                if (isset($mapping[$key]) && intval($mapping[$key]) >= 0) {
                    $idx = intval($mapping[$key]);
                    return isset($data[$idx]) ? trim($data[$idx]) : '';
                }
                return '';
            };

            $name = $get_mapped('name');
            $category = $get_mapped('category');
            $reg_price = $get_mapped('regular_price');
            $sale_price = $get_mapped('sale_price');
            $sku = $get_mapped('sku');
            $stock_status = $get_mapped('stock_status') ?: 'instock';
            $image_1 = $get_mapped('image_1');
            $image_2 = $get_mapped('image_2');
            $image_3 = $get_mapped('image_3');
            $image_4 = $get_mapped('image_4');
            $image_5 = $get_mapped('image_5');

            $row_errors = [];

            // 1. Name validation
            if (empty($name)) {
                $row_errors[] = [
                    'field' => 'name',
                    'message' => __('Product name is missing or empty.', 'modena')
                ];
            }

            // 2. Price validation
            $clean_reg_price = str_replace([',', '₹', ' '], '', $reg_price);
            $clean_sale_price = str_replace([',', '₹', ' '], '', $sale_price);

            if ($clean_reg_price !== '' && !is_numeric($clean_reg_price)) {
                $row_errors[] = [
                    'field' => 'regular_price',
                    'message' => sprintf(__('Regular price "%s" is not a valid number.', 'modena'), esc_html($reg_price))
                ];
            }

            if ($clean_sale_price !== '' && !is_numeric($clean_sale_price)) {
                $row_errors[] = [
                    'field' => 'sale_price',
                    'message' => sprintf(__('Sale price "%s" is not a valid number.', 'modena'), esc_html($sale_price))
                ];
            }

            if ($clean_reg_price !== '' && $clean_sale_price !== '' && is_numeric($clean_reg_price) && is_numeric($clean_sale_price)) {
                if (floatval($clean_sale_price) > floatval($clean_reg_price)) {
                    $row_errors[] = [
                        'field' => 'sale_price',
                        'message' => sprintf(__('Sale price (₹%s) cannot be higher than regular price (₹%s).', 'modena'), esc_html($clean_sale_price), esc_html($clean_reg_price))
                    ];
                }
            }

            // 3. Duplicate check
            $existing_id = 0;
            if (!empty($sku)) {
                $existing_id = wc_get_product_id_by_sku($sku);
            }
            if (!$existing_id && !empty($name)) {
                $existing_posts = get_posts([
                    'post_type' => 'product',
                    'title' => $name,
                    'post_status' => 'any',
                    'posts_per_page' => 1
                ]);
                if (!empty($existing_posts)) {
                    $existing_id = $existing_posts[0]->ID;
                }
            }

            $img_count = count(array_filter([$image_1, $image_2, $image_3, $image_4, $image_5]));
            $is_valid = empty($row_errors);

            if (!$is_valid) {
                foreach ($row_errors as $err) {
                    $errors[] = [
                        'row'     => $row_index,
                        'product' => $name ?: __('Row ' . $row_index, 'modena'),
                        'field'   => $err['field'],
                        'message' => $err['message']
                    ];
                }
            }

            $deduced_cat = self::deduce_category_name($category, $name, $get_mapped('description'));

            // Full product data kept on server
            $server_products[$row_index] = [
                'row_number'          => $row_index,
                'name'                => $name,
                'category'            => $deduced_cat,
                'sku'                 => $sku,
                'regular_price'       => $clean_reg_price,
                'sale_price'          => $clean_sale_price,
                'stock_status'        => $stock_status,
                'image_1'             => $image_1,
                'image_2'             => $image_2,
                'image_3'             => $image_3,
                'image_4'             => $image_4,
                'image_5'             => $image_5,
                'images_count'        => $img_count,
                'short_description'   => $get_mapped('short_description'),
                'description'         => $get_mapped('description'),
                'included_components' => $get_mapped('included_components'),
                'usp'                 => $get_mapped('usp'),
                'dimension'           => $get_mapped('dimension'),
                'manufacturer'        => $get_mapped('manufacturer'),
                'is_update'           => ($existing_id > 0),
                'existing_id'         => $existing_id,
                'is_valid'            => $is_valid,
                'errors'              => $row_errors
            ];

            // Lightweight row sent to browser UI (excluding huge base64 strings)
            $client_preview_rows[] = [
                'row_number'    => $row_index,
                'name'          => $name,
                'category'      => $deduced_cat,
                'sku'           => $sku,
                'regular_price' => $clean_reg_price,
                'sale_price'    => $clean_sale_price,
                'stock_status'  => $stock_status,
                'images_count'  => $img_count,
                'is_update'     => ($existing_id > 0),
                'existing_id'   => $existing_id,
                'is_valid'      => $is_valid
            ];
        }
        fclose($handle);

        // Save server-side session cache
        $session_id = 'modena_sess_' . wp_generate_password(16, false);
        $session_filepath = $wp_upload_dir['basedir'] . '/' . $session_id . '.json';
        file_put_contents($session_filepath, json_encode($server_products));

        $total_rows = count($client_preview_rows);
        $valid_rows = count(array_filter($client_preview_rows, function($r) { return $r['is_valid']; }));
        $invalid_rows = $total_rows - $valid_rows;

        wp_send_json_success([
            'session_id'   => $session_id,
            'total'        => $total_rows,
            'valid'        => $valid_rows,
            'invalid'      => $invalid_rows,
            'rows'         => $client_preview_rows,
            'errors'       => $errors
        ]);
    }

    /**
     * AJAX 3: Process Batch Import with Multi-Format Image & Base64 Support
     */
    public static function ajax_process_import_batch() {
        @ini_set('memory_limit', '1024M');
        @set_time_limit(600);

        check_ajax_referer('modena_importer_nonce', 'security');

        if (!current_user_can('manage_woocommerce')) {
            wp_send_json_error(['message' => __('Unauthorized permission.', 'modena')]);
        }

        $session_id = sanitize_text_field($_POST['session_id'] ?? '');
        $row_numbers = isset($_POST['row_numbers']) ? json_decode(stripslashes($_POST['row_numbers']), true) : [];
        $duplicate_action = isset($_POST['duplicate_action']) ? sanitize_text_field($_POST['duplicate_action']) : 'update';

        $wp_upload_dir = wp_upload_dir();
        $products_to_process = [];

        // Load from server-side session
        if (!empty($session_id)) {
            $session_file = $wp_upload_dir['basedir'] . '/' . sanitize_file_name($session_id) . '.json';
            if (file_exists($session_file)) {
                $session_data = json_decode(file_get_contents($session_file), true);
                if (is_array($session_data)) {
                    if (!empty($row_numbers) && is_array($row_numbers)) {
                        foreach ($row_numbers as $rnum) {
                            if (isset($session_data[$rnum])) {
                                $products_to_process[] = $session_data[$rnum];
                            }
                        }
                    } else {
                        $products_to_process = array_values($session_data);
                    }
                }
            }
        }

        // Direct payload fallback
        if (empty($products_to_process) && isset($_POST['products'])) {
            $products_to_process = json_decode(stripslashes($_POST['products']), true);
        }

        if (empty($products_to_process) || !is_array($products_to_process)) {
            wp_send_json_error(['message' => __('No products found for this batch.', 'modena')]);
        }

        require_once(ABSPATH . 'wp-admin/includes/image.php');
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        require_once(ABSPATH . 'wp-admin/includes/media.php');

        $created = 0;
        $updated = 0;
        $skipped = 0;
        $failed = 0;
        $results = [];

        foreach ($products_to_process as $pdata) {
            $name = sanitize_text_field($pdata['name'] ?? '');
            if (empty($name)) {
                $failed++;
                continue;
            }

            $sku = sanitize_text_field($pdata['sku'] ?? '');
            $existing_id = intval($pdata['existing_id'] ?? 0);
            if (!$existing_id && !empty($sku)) {
                $existing_id = wc_get_product_id_by_sku($sku);
            }
            if (!$existing_id) {
                $found_posts = get_posts([
                    'post_type' => 'product',
                    'title' => $name,
                    'post_status' => 'any',
                    'posts_per_page' => 1
                ]);
                if (!empty($found_posts)) {
                    $existing_id = $found_posts[0]->ID;
                }
            }

            if ($existing_id && $duplicate_action === 'skip') {
                $skipped++;
                continue;
            }

            $is_new = false;
            if ($existing_id) {
                $product = wc_get_product($existing_id);
                if (!$product) {
                    $product = new WC_Product_Simple();
                    $is_new = true;
                }
            } else {
                $product = new WC_Product_Simple();
                $is_new = true;
            }

            // Set Core Fields
            $product->set_name($name);
            $product->set_status('publish');
            $product->set_catalog_visibility('visible');

            if (!empty($sku)) {
                $product->set_sku($sku);
            }

            if (isset($pdata['description'])) {
                $product->set_description(wp_kses_post($pdata['description']));
            }
            if (isset($pdata['short_description'])) {
                $product->set_short_description(wp_kses_post($pdata['short_description']));
            }

            // Stock Status
            $stock_stat = sanitize_text_field($pdata['stock_status'] ?? 'instock');
            $product->set_stock_status($stock_stat === 'outofstock' ? 'outofstock' : 'instock');

            // Prices
            $reg_price = sanitize_text_field($pdata['regular_price'] ?? '');
            $sale_price = sanitize_text_field($pdata['sale_price'] ?? '');

            $product->set_regular_price($reg_price);
            if ($sale_price !== '' && is_numeric($sale_price)) {
                $product->set_sale_price($sale_price);
                $product->set_price($sale_price);
            } else {
                $product->set_sale_price('');
                $product->set_price($reg_price);
            }

            $product_id = $product->save();
            if (!$product_id) {
                $failed++;
                continue;
            }

            // Category assignment strictly mapped to official 3 categories
            $cat_name = self::deduce_category_name($pdata['category'] ?? '', $name, $pdata['description'] ?? '');
            $cat_id = self::get_or_create_product_cat($cat_name);
            if ($cat_id) {
                $product->set_category_ids([$cat_id]);
            }

            // Custom Meta
            if (isset($pdata['included_components'])) {
                $raw_inc = $pdata['included_components'];
                $inc_lines = is_array($raw_inc) ? $raw_inc : array_values(array_filter(array_map('trim', preg_split('/[\r\n|]+/', $raw_inc))));
                update_post_meta($product_id, '_modena_included_components', $inc_lines);
            }

            if (isset($pdata['usp'])) {
                $raw_usp = $pdata['usp'];
                $usp_lines = is_array($raw_usp) ? $raw_usp : array_values(array_filter(array_map('trim', preg_split('/[\r\n|]+/', $raw_usp))));
                update_post_meta($product_id, '_modena_usp', $usp_lines);
            }

            if (isset($pdata['dimension'])) {
                update_post_meta($product_id, '_modena_dimensions', sanitize_textarea_field($pdata['dimension']));
            }

            if (isset($pdata['manufacturer'])) {
                $mfr = sanitize_text_field($pdata['manufacturer']);
                update_post_meta($product_id, '_modena_manufacturer', $mfr ?: 'Modena Kitchenware');
            }

            // Multi-Format Image Parser (Base64 Data URI, Raw Base64, URL, Local File)
            $image_candidates = [
                $pdata['image_1'] ?? '',
                $pdata['image_2'] ?? '',
                $pdata['image_3'] ?? '',
                $pdata['image_4'] ?? '',
                $pdata['image_5'] ?? ''
            ];

            $attachment_ids = [];
            foreach ($image_candidates as $img_raw) {
                if (empty($img_raw)) continue;
                $attach_id = self::process_image_attachment($img_raw, $product_id);
                if ($attach_id) {
                    $attachment_ids[] = $attach_id;
                }
            }

            if (!empty($attachment_ids)) {
                $product->set_image_id($attachment_ids[0]);
                if (count($attachment_ids) > 1) {
                    $product->set_gallery_image_ids(array_slice($attachment_ids, 1));
                }
            }

            $product->save();

            if ($is_new) {
                $created++;
            } else {
                $updated++;
            }
        }

        wp_send_json_success([
            'created' => $created,
            'updated' => $updated,
            'skipped' => $skipped,
            'failed'  => $failed
        ]);
    }

    private static function deduce_category_name($raw_cat, $name = '', $desc = '') {
        $text = strtolower($raw_cat . ' ' . $name . ' ' . $desc);
        
        if (strpos($text, 'cooker') !== false || strpos($text, 'kadai') !== false || strpos($text, 'pan') !== false || strpos($text, 'patra') !== false || strpos($text, 'tawa') !== false || strpos($text, 'wok') !== false || strpos($text, 'tripro') !== false || strpos($text, 'triply') !== false || strpos($text, 'cast iron') !== false || strpos($text, 'cookware') !== false) {
            return 'Cookware';
        }
        if (strpos($text, 'nutri') !== false || strpos($text, 'blender') !== false || strpos($text, 'bullet') !== false || strpos($text, 'juicer') !== false || strpos($text, 'smoothie') !== false) {
            return 'Nutrimix';
        }
        if (strpos($text, 'mixer') !== false || strpos($text, 'grinder') !== false || strpos($text, 'sindoor') !== false) {
            return 'Mixer Grinder';
        }
        return 'Cookware';
    }

    private static function get_or_create_product_cat($name) {
        $clean_name = self::deduce_category_name($name);
        
        $slug_map = [
            'Mixer Grinder' => 'mixer-grinder',
            'Nutrimix'      => 'nutrimix',
            'Cookware'      => 'cookware'
        ];
        
        $target_slug = $slug_map[$clean_name] ?? 'cookware';
        
        $term = get_term_by('slug', $target_slug, 'product_cat');
        if (!$term) {
            $term = get_term_by('name', $clean_name, 'product_cat');
        }
        if ($term) {
            return (int)$term->term_id;
        }

        $new_term = wp_insert_term($clean_name, 'product_cat', ['slug' => $target_slug]);
        if (!is_wp_error($new_term)) {
            return (int)$new_term['term_id'];
        }
        return 0;
    }

    /**
     * Universal Image Processor: Base64 Data URI, Raw Base64, Remote URL, and Local File
     */
    private static function process_image_attachment($img_str, $parent_id) {
        $img_str = trim($img_str);
        if (empty($img_str)) return false;

        global $wpdb;
        $wp_upload_dir = wp_upload_dir();

        // 1. Check for Base64 Data URI (e.g. data:image/png;base64,....)
        if (preg_match('/^data:image\/([a-zA-Z0-9\+\-]+);base64,(.+)$/s', $img_str, $matches)) {
            $img_type = strtolower($matches[1]);
            if ($img_type === 'jpeg') $img_type = 'jpg';
            $decoded = base64_decode($matches[2], true);
            if ($decoded !== false && strlen($decoded) > 50) {
                return self::create_attachment_from_binary($decoded, $img_type, $parent_id);
            }
        }

        // 2. Check for Raw Base64 string
        if (!filter_var($img_str, FILTER_VALIDATE_URL) && !file_exists($img_str) && strlen($img_str) > 100) {
            $clean_b64 = preg_replace('/\s+/', '', $img_str);
            if (preg_match('/^[a-zA-Z0-9\/\r\n+]+={0,2}$/', $clean_b64)) {
                $decoded = base64_decode($clean_b64, true);
                if ($decoded !== false && strlen($decoded) > 50) {
                    $ext = 'jpg';
                    if (substr($decoded, 0, 4) === "\x89PNG") {
                        $ext = 'png';
                    } elseif (substr($decoded, 0, 3) === "\xFF\xD8\xFF") {
                        $ext = 'jpg';
                    } elseif (substr($decoded, 0, 4) === "RIFF" && substr($decoded, 8, 4) === "WEBP") {
                        $ext = 'webp';
                    } elseif (substr($decoded, 0, 4) === "GIF8") {
                        $ext = 'gif';
                    }
                    return self::create_attachment_from_binary($decoded, $ext, $parent_id);
                }
            }
        }

        // 3. Check for Local File Path or Theme Asset
        $filename = basename($img_str);
        if (($pos = strpos($filename, '?')) !== false) {
            $filename = substr($filename, 0, $pos);
        }

        // Fast Lookup by filename
        $existing_attach_id = $wpdb->get_var($wpdb->prepare(
            "SELECT post_id FROM $wpdb->postmeta WHERE meta_key = '_wp_attached_file' AND meta_value LIKE %s LIMIT 1",
            '%' . $wpdb->esc_like($filename)
        ));

        if ($existing_attach_id) {
            return intval($existing_attach_id);
        }

        $theme_dir = get_template_directory();
        $site_url = site_url();

        $local_candidate = '';
        if (strpos($img_str, $site_url) !== false) {
            $rel_path = str_replace($site_url, '', $img_str);
            $candidate = ABSPATH . ltrim($rel_path, '/\\');
            if (file_exists($candidate)) {
                $local_candidate = $candidate;
            }
        } elseif (file_exists($img_str)) {
            $local_candidate = $img_str;
        } elseif (file_exists($theme_dir . '/' . ltrim($img_str, '/\\'))) {
            $local_candidate = $theme_dir . '/' . ltrim($img_str, '/\\');
        }

        if ($local_candidate && file_exists($local_candidate)) {
            $filetype = wp_check_filetype($filename, null);
            $target_file = $wp_upload_dir['path'] . '/' . wp_unique_filename($wp_upload_dir['path'], $filename);
            copy($local_candidate, $target_file);

            $attachment = [
                'guid'           => $wp_upload_dir['url'] . '/' . basename($target_file),
                'post_mime_type' => $filetype['type'] ?: 'image/jpeg',
                'post_title'     => preg_replace('/\.[^.]+$/', '', $filename),
                'post_content'   => '',
                'post_status'    => 'inherit'
            ];

            $attach_id = wp_insert_attachment($attachment, $target_file, $parent_id);
            if (!is_wp_error($attach_id)) {
                try {
                    $attach_data = wp_generate_attachment_metadata($attach_id, $target_file);
                    if ($attach_data) {
                        wp_update_attachment_metadata($attach_id, $attach_data);
                    }
                } catch (Throwable $e) {}
                return $attach_id;
            }
        }

        // 4. Check for Remote HTTP/HTTPS URL
        if (filter_var($img_str, FILTER_VALIDATE_URL)) {
            $tmp = download_url($img_str);
            if (!is_wp_error($tmp)) {
                $file_array = [
                    'name'     => $filename,
                    'tmp_name' => $tmp
                ];

                $id = media_handle_sideload($file_array, $parent_id);
                if (!is_wp_error($id)) {
                    return $id;
                }
            }
        }

        return false;
    }

    /**
     * Create Media Library Attachment from Raw Decoded Binary Data
     */
    private static function create_attachment_from_binary($binary_data, $extension, $parent_id) {
        global $wpdb;
        $wp_upload_dir = wp_upload_dir();
        $data_hash = md5($binary_data);

        // Fast Lookup: Check if exact image hash is already in media library
        $existing_id = $wpdb->get_var($wpdb->prepare(
            "SELECT post_id FROM $wpdb->postmeta WHERE meta_key = '_modena_image_hash' AND meta_value = %s LIMIT 1",
            $data_hash
        ));
        if ($existing_id) {
            return intval($existing_id);
        }

        $ext = in_array($extension, ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg']) ? $extension : 'jpg';
        $mime_map = [
            'png'  => 'image/png',
            'jpg'  => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'webp' => 'image/webp',
            'gif'  => 'image/gif',
            'svg'  => 'image/svg+xml'
        ];
        $mime = $mime_map[$ext] ?? 'image/jpeg';

        $filename = 'product_' . $parent_id . '_' . substr($data_hash, 0, 10) . '.' . $ext;
        $target_file = $wp_upload_dir['path'] . '/' . wp_unique_filename($wp_upload_dir['path'], $filename);

        file_put_contents($target_file, $binary_data);

        $attachment = [
            'guid'           => $wp_upload_dir['url'] . '/' . basename($target_file),
            'post_mime_type' => $mime,
            'post_title'     => preg_replace('/\.[^.]+$/', '', basename($target_file)),
            'post_content'   => '',
            'post_status'    => 'inherit'
        ];

        $attach_id = wp_insert_attachment($attachment, $target_file, $parent_id);
        if (!is_wp_error($attach_id)) {
            update_post_meta($attach_id, '_modena_image_hash', $data_hash);
            try {
                $attach_data = wp_generate_attachment_metadata($attach_id, $target_file);
                if ($attach_data) {
                    wp_update_attachment_metadata($attach_id, $attach_data);
                }
            } catch (Throwable $e) {}
            return $attach_id;
        }

        return false;
    }

    /**
     * Render Complete Admin Page with Progress Bar, Speed Meter, and Session Importer
     */
    public static function render_admin_page() {
        if (!current_user_can('manage_woocommerce')) {
            wp_die(__('You do not have sufficient permissions to access this page.', 'modena'));
        }

        $nonce = wp_create_nonce('modena_importer_nonce');
        $blank_download_url = wp_nonce_url(admin_url('admin-post.php?action=modena_download_blank_template'), 'modena_download_template');
        $example_download_url = wp_nonce_url(admin_url('admin-post.php?action=modena_download_example_template'), 'modena_download_example');
        $empty_trash_url = wp_nonce_url(admin_url('admin-post.php?action=modena_empty_product_trash'), 'modena_empty_trash');

        $trashed_count = count(get_posts([
            'post_type' => 'product',
            'post_status' => 'trash',
            'posts_per_page' => -1,
            'fields' => 'ids'
        ]));

        ?>
        <div class="wrap modena-importer-wrap">
            <h1 class="modena-importer-title">
                <span class="dashicons dashicons-upload" style="font-size:32px; width:32px; height:32px; vertical-align:middle; color:#c91f26; margin-right:8px;"></span>
                <?php esc_html_e('Modena Product Importer', 'modena'); ?>
            </h1>
            <p class="modena-importer-subtitle">
                <?php esc_html_e('Import any product CSV spreadsheet with Base64/URL image parsing, live upload speed & progress, and automated specifications synchronization.', 'modena'); ?>
            </p>

            <?php if (isset($_GET['trash_emptied'])) : ?>
                <div class="notice notice-success is-dismissible" style="margin-bottom:20px;">
                    <p><?php echo sprintf(esc_html__('Successfully emptied %d products from Trash permanently.', 'modena'), intval($_GET['trash_emptied'])); ?></p>
                </div>
            <?php endif; ?>

            <style>
                .modena-importer-wrap { max-width: 1150px; margin-top: 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif; }
                .modena-importer-title { font-size: 26px; font-weight: 700; color: #1d2327; margin-bottom: 4px; }
                .modena-importer-subtitle { font-size: 14px; color: #50575e; margin-bottom: 24px; }
                .modena-card { background: #ffffff; border: 1px solid #c3c4c7; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); padding: 24px; margin-bottom: 24px; }
                .modena-card h2 { font-size: 17px; font-weight: 600; margin-top: 0; margin-bottom: 12px; color: #1d2327; border-bottom: 1px solid #f0f0f1; padding-bottom: 10px; display: flex; align-items: center; justify-content: space-between; }
                .modena-btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 18px; font-size: 13px; font-weight: 600; border-radius: 4px; text-decoration: none; cursor: pointer; transition: all 0.15s ease-in-out; border: 1px solid transparent; }
                .modena-btn-primary { background: #c91f26; color: #fff; }
                .modena-btn-primary:hover { background: #a6151b; color: #fff; }
                .modena-btn-secondary { background: #f6f7f7; color: #2271b1; border-color: #2271b1; }
                .modena-btn-secondary:hover { background: #f0f0f1; color: #135e96; border-color: #135e96; }
                .modena-btn-danger { background: #fcf0f1; color: #d63638; border-color: #d63638; }
                .modena-btn-danger:hover { background: #d63638; color: #fff; }
                .modena-dropzone-label { display: block; border: 2px dashed #8c8f94; border-radius: 8px; padding: 36px 20px; text-align: center; background: #fdfdfd; transition: all 0.2s ease; cursor: pointer; }
                .modena-dropzone-label:hover, .modena-dropzone-label.dragover { border-color: #c91f26; background: #fff5f5; }
                .modena-metric-badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 700; margin-right: 8px; }
                .modena-badge-total { background: #f0f0f1; color: #2c3338; }
                .modena-badge-valid { background: #e7f7ed; color: #008a20; }
                .modena-badge-invalid { background: #fcf0f1; color: #d63638; }
                .modena-table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 13px; }
                .modena-table th { background: #f6f7f7; text-align: left; padding: 10px 12px; border-bottom: 1px solid #c3c4c7; font-weight: 600; }
                .modena-table td { padding: 10px 12px; border-bottom: 1px solid #f0f0f1; vertical-align: middle; }
                .modena-progress-bar-wrap { background: #e2e4e7; border-radius: 8px; height: 18px; overflow: hidden; margin-top: 10px; box-shadow: inset 0 1px 2px rgba(0,0,0,0.1); }
                .modena-progress-bar { background: linear-gradient(90deg, #c91f26, #e63946); height: 100%; width: 0%; transition: width 0.2s ease; border-radius: 8px; }
                .modena-mapping-select { width: 100%; max-width: 320px; padding: 6px 10px; border-radius: 4px; border: 1px solid #8c8f94; font-size: 13px; font-weight: 500; }
            </style>

            <!-- STEP 1: DOWNLOAD TEMPLATE & TRASH CLEANUP -->
            <div class="modena-card">
                <h2>
                    <span>1. <?php esc_html_e('Download Ready-to-Use CSV Template', 'modena'); ?></span>
                    <?php if ($trashed_count > 0) : ?>
                        <a href="<?php echo esc_url($empty_trash_url); ?>" onclick="return confirm('Permanently delete all <?php echo $trashed_count; ?> trashed products? This cannot be undone.');" class="modena-btn modena-btn-danger" style="font-size:12px; padding:4px 10px;">
                            <span class="dashicons dashicons-trash"></span>
                            <?php echo sprintf(esc_html__('Empty Trash (%d products)', 'modena'), $trashed_count); ?>
                        </a>
                    <?php endif; ?>
                </h2>
                <p><?php esc_html_e('Download our pre-structured template or upload any existing CSV spreadsheet. Base64 images, URLs, and local files are automatically parsed.', 'modena'); ?></p>
                <div style="display:flex; gap:12px; margin-top:16px;">
                    <a href="<?php echo esc_url($blank_download_url); ?>" class="modena-btn modena-btn-primary">
                        <span class="dashicons dashicons-download"></span>
                        <?php esc_html_e('Download Blank CSV Template', 'modena'); ?>
                    </a>
                    <a href="<?php echo esc_url($example_download_url); ?>" class="modena-btn modena-btn-secondary">
                        <span class="dashicons dashicons-media-spreadsheet"></span>
                        <?php esc_html_e('Download Example CSV', 'modena'); ?>
                    </a>
                </div>
            </div>

            <!-- STEP 2: UPLOAD CSV (WITH PROGRESS BAR & SPEED METER) -->
            <div class="modena-card">
                <h2><span>2. <?php esc_html_e('Upload Products CSV File', 'modena'); ?></span></h2>
                
                <label for="modena-file-input" class="modena-dropzone-label" id="modena-dropzone">
                    <span class="dashicons dashicons-upload" style="font-size:44px; width:44px; height:44px; color:#c91f26;"></span>
                    <p style="margin:10px 0 4px; font-weight:700; font-size:15px; color:#1d2327;">
                        <?php esc_html_e('Drag and drop your CSV file here, or click to browse', 'modena'); ?>
                    </p>
                    <p style="margin:0; font-size:13px; color:#646970;">
                        <?php esc_html_e('Supports Base64 Images, URLs, and UTF-8 .csv files (Up to 500MB supported)', 'modena'); ?>
                    </p>
                    <button type="button" id="modena-browse-btn" class="modena-btn modena-btn-secondary" style="margin-top:14px; pointer-events:none;">
                        <span class="dashicons dashicons-media-document"></span>
                        <?php esc_html_e('Browse File from Computer', 'modena'); ?>
                    </button>
                    <input type="file" id="modena-file-input" accept=".csv,text/csv" style="position:absolute; width:1px; height:1px; opacity:0; overflow:hidden;" />
                </label>

                <!-- Live Upload Progress Bar & Speed Meter -->
                <div id="modena-upload-progress-container" style="display:none; margin-top:16px; background:#f6f7f7; padding:14px 18px; border-radius:6px; border:1px solid #c3c4c7;">
                    <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:600; color:#1d2327; margin-bottom:6px;">
                        <span id="modena-upload-status-text"><?php esc_html_e('Uploading CSV file to server...', 'modena'); ?></span>
                        <span id="modena-upload-speed-badge" style="color:#c91f26; font-weight:700;">0.00 MB/s (0.0 Mbps)</span>
                    </div>
                    <div class="modena-progress-bar-wrap">
                        <div class="modena-progress-bar" id="modena-upload-progress-bar"></div>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:12px; color:#646970; margin-top:6px;">
                        <span id="modena-upload-bytes-text">0 MB / 0 MB</span>
                        <span id="modena-upload-percent-text">0%</span>
                    </div>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:16px;">
                    <span id="modena-selected-filename" style="font-weight:600; color:#1d2327;"></span>
                    <button type="button" id="modena-parse-btn" class="modena-btn modena-btn-primary" style="display:none; font-size:14px; padding:10px 20px;">
                        <span class="dashicons dashicons-controls-forward"></span>
                        <?php esc_html_e('Upload & Configure Column Mapping →', 'modena'); ?>
                    </button>
                </div>
            </div>

            <!-- STEP 3: COLUMN MAPPING INTERFACE -->
            <div class="modena-card" id="modena-mapping-card" style="display:none;">
                <h2>
                    <span>3. <?php esc_html_e('Configure Column Mapping', 'modena'); ?></span>
                    <span style="font-size:12px; font-weight:normal; color:#50575e;">
                        <?php esc_html_e('Columns are auto-detected. Adjust any dropdown if necessary.', 'modena'); ?>
                    </span>
                </h2>
                <p style="font-size:13px; color:#50575e; margin-bottom:16px;">
                    <?php esc_html_e('Map the columns from your uploaded CSV to the corresponding Modena & WooCommerce fields.', 'modena'); ?>
                </p>

                <table class="modena-table" id="modena-mapping-table">
                    <thead>
                        <tr>
                            <th style="width:28%;"><?php esc_html_e('Modena / WooCommerce Field', 'modena'); ?></th>
                            <th style="width:36%;"><?php esc_html_e('Your CSV Column', 'modena'); ?></th>
                            <th style="width:36%;"><?php esc_html_e('Sample Data from Your File', 'modena'); ?></th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>

                <div style="margin-top:20px; display:flex; justify-content:flex-end; gap:12px;">
                    <button type="button" id="modena-mapping-cancel-btn" class="modena-btn modena-btn-secondary"><?php esc_html_e('Cancel', 'modena'); ?></button>
                    <button type="button" id="modena-validate-mapped-btn" class="modena-btn modena-btn-primary" style="font-size:14px; padding:10px 20px;">
                        <span class="dashicons dashicons-search"></span>
                        <?php esc_html_e('Validate & Preview Data →', 'modena'); ?>
                    </button>
                </div>
            </div>

            <!-- STEP 4: PREVIEW & CONFIRMATION -->
            <div class="modena-card" id="modena-preview-card" style="display:none;">
                <h2>
                    <span>4. <?php esc_html_e('Import Preview & Validation', 'modena'); ?></span>
                    <div>
                        <span class="modena-metric-badge modena-badge-total" id="badge-total">0 Products</span>
                        <span class="modena-metric-badge modena-badge-valid" id="badge-valid">0 Valid</span>
                        <span class="modena-metric-badge modena-badge-invalid" id="badge-invalid">0 Errors</span>
                    </div>
                </h2>

                <div id="modena-duplicate-settings" style="background:#f6f7f7; padding:12px 16px; border-radius:6px; margin-bottom:16px; display:flex; align-items:center; justify-content:space-between;">
                    <div>
                        <strong><?php esc_html_e('Duplicate Product Strategy:', 'modena'); ?></strong>
                        <span style="font-size:12px; color:#50575e; margin-left:8px;"><?php esc_html_e('If a product with the same name or SKU already exists:', 'modena'); ?></span>
                    </div>
                    <div>
                        <label style="margin-right:16px; cursor:pointer;">
                            <input type="radio" name="duplicate_action" value="update" checked /> <?php esc_html_e('Update Existing Product', 'modena'); ?>
                        </label>
                        <label style="cursor:pointer;">
                            <input type="radio" name="duplicate_action" value="skip" /> <?php esc_html_e('Skip Existing Product', 'modena'); ?>
                        </label>
                    </div>
                </div>

                <div id="modena-errors-container" style="display:none; margin-bottom:16px; background:#fcf0f1; border-left:4px solid #d63638; padding:12px 16px; border-radius:0 4px 4px 0;">
                    <strong style="color:#d63638;"><?php esc_html_e('Validation Errors Found:', 'modena'); ?></strong>
                    <ul id="modena-errors-list" style="margin:8px 0 0 16px; color:#b32d2e; font-size:13px;"></ul>
                </div>

                <div style="max-height: 420px; overflow-y: auto; border: 1px solid #c3c4c7; border-radius: 4px;">
                    <table class="modena-table" id="modena-preview-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th><?php esc_html_e('Product Name', 'modena'); ?></th>
                                <th><?php esc_html_e('Category', 'modena'); ?></th>
                                <th><?php esc_html_e('Images', 'modena'); ?></th>
                                <th><?php esc_html_e('Regular Price', 'modena'); ?></th>
                                <th><?php esc_html_e('Sale Price', 'modena'); ?></th>
                                <th><?php esc_html_e('Stock', 'modena'); ?></th>
                                <th><?php esc_html_e('Action', 'modena'); ?></th>
                                <th><?php esc_html_e('Validation', 'modena'); ?></th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>

                <div style="margin-top:20px; display:flex; justify-content:space-between; align-items:center;">
                    <button type="button" id="modena-back-to-mapping-btn" class="modena-btn modena-btn-secondary">
                        ← <?php esc_html_e('Back to Column Mapping', 'modena'); ?>
                    </button>
                    <button type="button" id="modena-import-btn" class="modena-btn modena-btn-primary" style="font-size:15px; padding:12px 24px;">
                        <span class="dashicons dashicons-database-import"></span>
                        <?php esc_html_e('Start Safe Product Import Now', 'modena'); ?>
                    </button>
                </div>
            </div>

            <!-- STEP 5: LIVE BATCH PROGRESS & REPORT -->
            <div class="modena-card" id="modena-progress-card" style="display:none;">
                <h2><span>5. <?php esc_html_e('Importing Products into WooCommerce', 'modena'); ?></span></h2>
                <p id="modena-progress-status" style="font-size:14px; font-weight:600; color:#1d2327;">
                    <?php esc_html_e('Initializing safe batch import...', 'modena'); ?>
                </p>
                <div class="modena-progress-bar-wrap">
                    <div class="modena-progress-bar" id="modena-progress-bar"></div>
                </div>
                <div id="modena-results-wrap" style="display:none; margin-top:20px;">
                    <div style="background:#e7f7ed; border-left:4px solid #008a20; padding:16px; border-radius:0 4px 4px 0; margin-bottom:16px;">
                        <h3 style="margin:0 0 8px; color:#008a20; font-size:16px;">
                            <span class="dashicons dashicons-yes"></span> <?php esc_html_e('Import Completed Successfully!', 'modena'); ?>
                        </h3>
                        <p style="margin:0; font-size:14px;" id="modena-results-summary"></p>
                    </div>
                    <div style="display:flex; gap:12px;">
                        <a href="<?php echo esc_url(admin_url('edit.php?post_type=product')); ?>" class="modena-btn modena-btn-primary">
                            <span class="dashicons dashicons-cart"></span> <?php esc_html_e('View Products in Admin', 'modena'); ?>
                        </a>
                        <a href="<?php echo esc_url(home_url('/')); ?>" target="_blank" class="modena-btn modena-btn-secondary">
                            <span class="dashicons dashicons-external"></span> <?php esc_html_e('View Live Website', 'modena'); ?>
                        </a>
                        <button type="button" id="modena-new-import-btn" class="modena-btn modena-btn-secondary">
                            <span class="dashicons dashicons-update"></span> <?php esc_html_e('Import Another File', 'modena'); ?>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <script>
        jQuery(document).ready(function($) {
            const nonce = '<?php echo esc_js($nonce); ?>';
            const ajaxurl = '<?php echo esc_js(admin_url('admin-ajax.php')); ?>';
            let currentTempFilename = '';
            let currentSessionId = '';
            let currentHeaders = [];
            let currentSampleRows = [];
            let currentTargetFields = {};
            let validatedRows = [];

            const $dropzone = $('#modena-dropzone');
            const $fileInput = $('#modena-file-input');
            const $filename = $('#modena-selected-filename');
            const $parseBtn = $('#modena-parse-btn');
            const $mappingCard = $('#modena-mapping-card');
            const $validateMappedBtn = $('#modena-validate-mapped-btn');
            const $previewCard = $('#modena-preview-card');
            const $progressCard = $('#modena-progress-card');
            const $progressBar = $('#modena-progress-bar');
            const $importBtn = $('#modena-import-btn');

            $dropzone.on('dragover dragenter', function(e) {
                e.preventDefault();
                e.stopPropagation();
                $(this).addClass('dragover');
            });
            $dropzone.on('dragleave dragend drop', function(e) {
                e.preventDefault();
                e.stopPropagation();
                $(this).removeClass('dragover');
            });
            $dropzone.on('drop', function(e) {
                if (e.originalEvent.dataTransfer && e.originalEvent.dataTransfer.files.length) {
                    $fileInput[0].files = e.originalEvent.dataTransfer.files;
                    handleFileSelect();
                }
            });

            $fileInput.on('change', handleFileSelect);

            function handleFileSelect() {
                const file = $fileInput[0].files[0];
                if (file) {
                    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
                    const sizeKB = (file.size / 1024).toFixed(1);
                    const sizeText = file.size > 1048576 ? sizeMB + ' MB' : sizeKB + ' KB';
                    $filename.text(file.name + ' (' + sizeText + ')');
                    $parseBtn.show();
                    $mappingCard.hide();
                    $previewCard.hide();
                    $progressCard.hide();
                    $('#modena-upload-progress-container').hide();
                }
            }

            // Step 2 -> Step 3: Parse Headers with Live Progress Bar & MBPS Speed Meter
            $parseBtn.on('click', function() {
                const file = $fileInput[0].files[0];
                if (!file) return;

                $parseBtn.prop('disabled', true).text('Uploading & Reading CSV...');
                $('#modena-upload-progress-container').slideDown(150);
                $('#modena-upload-progress-bar').css('width', '0%');
                $('#modena-upload-status-text').text('Uploading CSV file to server...');

                const formData = new FormData();
                formData.append('action', 'modena_parse_csv_headers');
                formData.append('security', nonce);
                formData.append('csv_file', file);

                const startTime = Date.now();

                const xhr = new XMLHttpRequest();
                xhr.open('POST', ajaxurl, true);

                xhr.upload.onprogress = function(e) {
                    if (e.lengthComputable) {
                        const percent = Math.round((e.loaded / e.total) * 100);
                        const elapsedSec = (Date.now() - startTime) / 1000;
                        
                        const loadedMB = (e.loaded / (1024 * 1024)).toFixed(2);
                        const totalMB = (e.total / (1024 * 1024)).toFixed(2);

                        let speedText = '0.00 MB/s (0.0 Mbps)';
                        if (elapsedSec > 0.1) {
                            const bytesPerSec = e.loaded / elapsedSec;
                            const mbs = (bytesPerSec / (1024 * 1024)).toFixed(2);
                            const mbps = ((bytesPerSec * 8) / (1024 * 1024)).toFixed(1);
                            speedText = mbs + ' MB/s (' + mbps + ' Mbps)';
                        }

                        $('#modena-upload-progress-bar').css('width', percent + '%');
                        $('#modena-upload-percent-text').text(percent + '%');
                        $('#modena-upload-bytes-text').text(loadedMB + ' MB / ' + totalMB + ' MB');
                        $('#modena-upload-speed-badge').text(speedText);

                        if (percent >= 100) {
                            $('#modena-upload-status-text').text('Upload complete. Parsing CSV structure and detecting columns...');
                        }
                    }
                };

                xhr.onload = function() {
                    $parseBtn.prop('disabled', false).html('<span class="dashicons dashicons-controls-forward"></span> Upload & Configure Column Mapping →');
                    
                    try {
                        const res = JSON.parse(xhr.responseText);
                        if (!res.success) {
                            alert(res.data.message || 'Failed to parse CSV headers.');
                            return;
                        }

                        currentTempFilename = res.data.temp_filename;
                        currentHeaders = res.data.headers;
                        currentSampleRows = res.data.sample_rows;
                        currentTargetFields = res.data.target_fields;

                        $('#modena-upload-status-text').text('CSV Columns Loaded Successfully!');
                        buildMappingTable(res.data);
                    } catch (err) {
                        alert('Server error while reading CSV file. ' + err);
                    }
                };

                xhr.onerror = function() {
                    $parseBtn.prop('disabled', false).html('<span class="dashicons dashicons-controls-forward"></span> Upload & Configure Column Mapping →');
                    alert('Network error during file upload.');
                };

                xhr.send(formData);
            });

            function buildMappingTable(data) {
                const $tbody = $('#modena-mapping-table tbody').empty();
                const headers = data.headers;
                const autoMap = data.auto_mapping;
                const sampleRows = data.sample_rows;

                $.each(data.target_fields, function(fieldKey, fieldInfo) {
                    const $select = $('<select class="modena-mapping-select" data-field="' + fieldKey + '">');
                    $select.append('<option value="-1">-- Do Not Import / Skip --</option>');

                    headers.forEach(h => {
                        const isSelected = (autoMap[fieldKey] === h.index);
                        $select.append('<option value="' + h.index + '" ' + (isSelected ? 'selected' : '') + '>' + h.name + ' (Column #' + (h.index + 1) + ')</option>');
                    });

                    const sampleSpan = $('<span style="color:#50575e; font-size:12px; font-style:italic;">');
                    function updateSampleText() {
                        const selectedCol = parseInt($select.val());
                        if (selectedCol >= 0 && sampleRows.length > 0 && sampleRows[0][selectedCol] !== undefined) {
                            let val = sampleRows[0][selectedCol];
                            if (val && val.length > 60) val = val.substring(0, 57) + '...';
                            sampleSpan.text(val ? 'e.g. "' + val + '"' : '(Empty in sample)');
                        } else {
                            sampleSpan.text('(Empty / None)');
                        }
                    }
                    $select.on('change', updateSampleText);
                    updateSampleText();

                    const reqTag = fieldInfo.required 
                        ? ' <span style="color:#d63638;font-weight:bold;">*Required</span>' 
                        : ' <span style="color:#646970;font-size:11px;">(Optional)</span>';

                    const tr = $('<tr>')
                        .append('<td><strong>' + fieldInfo.label + '</strong>' + reqTag + '<br><small style="color:#646970;">' + fieldInfo.desc + '</small></td>')
                        .append($('<td>').append($select))
                        .append($('<td>').append(sampleSpan));

                    $tbody.append(tr);
                });

                $mappingCard.slideDown(250);
                $('html, body').animate({ scrollTop: $mappingCard.offset().top - 40 }, 300);
            }

            $('#modena-mapping-cancel-btn').on('click', function() {
                $mappingCard.slideUp(200);
            });

            // Step 3 -> Step 4: Validate Mapped Data with Session ID
            $validateMappedBtn.on('click', function() {
                const mapping = {};
                $('.modena-mapping-select').each(function() {
                    const field = $(this).data('field');
                    mapping[field] = parseInt($(this).val());
                });

                if (mapping['name'] === -1) {
                    alert('You must map the "Product Name" field before validating.');
                    return;
                }

                $validateMappedBtn.prop('disabled', true).text('Validating Data...');

                $.ajax({
                    url: ajaxurl,
                    type: 'POST',
                    data: {
                        action: 'modena_validate_mapped_csv',
                        security: nonce,
                        temp_filename: currentTempFilename,
                        mapping: JSON.stringify(mapping)
                    },
                    success: function(res) {
                        $validateMappedBtn.prop('disabled', false).html('<span class="dashicons dashicons-search"></span> Validate & Preview Data →');
                        if (!res.success) {
                            alert(res.data.message || 'Validation failed.');
                            return;
                        }

                        currentSessionId = res.data.session_id;
                        renderPreview(res.data);
                    },
                    error: function() {
                        $validateMappedBtn.prop('disabled', false).html('<span class="dashicons dashicons-search"></span> Validate & Preview Data →');
                        alert('Server error during validation.');
                    }
                });
            });

            function renderPreview(data) {
                validatedRows = data.rows;
                $('#badge-total').text(data.total + ' Products');
                $('#badge-valid').text(data.valid + ' Valid');
                $('#badge-invalid').text(data.invalid + ' Errors');

                const $tbody = $('#modena-preview-table tbody').empty();

                if (data.errors && data.errors.length > 0) {
                    const $errList = $('#modena-errors-list').empty();
                    data.errors.forEach(err => {
                        $errList.append('<li>Row ' + err.row + ' (' + err.product + '): <strong>' + err.field + '</strong> - ' + err.message + '</li>');
                    });
                    $('#modena-errors-container').show();
                } else {
                    $('#modena-errors-container').hide();
                }

                data.rows.forEach((r) => {
                    const statusBadge = r.is_valid 
                        ? '<span style="color:#008a20;font-weight:600;"><span class="dashicons dashicons-yes"></span> Valid</span>'
                        : '<span style="color:#d63638;font-weight:600;"><span class="dashicons dashicons-warning"></span> Error</span>';

                    const actionBadge = r.is_update
                        ? '<span style="background:#fff3cd;color:#856404;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;">Update ID: ' + r.existing_id + '</span>'
                        : '<span style="background:#e7f7ed;color:#008a20;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;">New Product</span>';

                    const stockBadge = r.stock_status === 'outofstock'
                        ? '<span style="color:#d63638;font-weight:600;">Out of Stock</span>'
                        : '<span style="color:#008a20;font-weight:600;">In Stock</span>';

                    const tr = $('<tr>')
                        .append('<td>' + r.row_number + '</td>')
                        .append('<td><strong>' + $('<div>').text(r.name).html() + '</strong>' + (r.sku ? '<br><small style="color:#646970;">SKU: ' + r.sku + '</small>' : '') + '</td>')
                        .append('<td><span style="background:#f0f0f1;padding:2px 6px;border-radius:4px;font-size:11px;">' + $('<div>').text(r.category).html() + '</span></td>')
                        .append('<td>' + r.images_count + ' image(s)</td>')
                        .append('<td>' + (r.regular_price ? '₹' + r.regular_price : '<span style="color:#8c8f94;">-</span>') + '</td>')
                        .append('<td>' + (r.sale_price ? '₹' + r.sale_price : '<span style="color:#8c8f94;">-</span>') + '</td>')
                        .append('<td>' + stockBadge + '</td>')
                        .append('<td>' + actionBadge + '</td>')
                        .append('<td>' + statusBadge + '</td>');

                    $tbody.append(tr);
                });

                $mappingCard.hide();
                $previewCard.slideDown(250);
                $('html, body').animate({ scrollTop: $previewCard.offset().top - 40 }, 300);
            }

            $('#modena-back-to-mapping-btn').on('click', function() {
                $previewCard.hide();
                $mappingCard.slideDown(250);
                $('html, body').animate({ scrollTop: $mappingCard.offset().top - 40 }, 300);
            });

            // Step 4 -> Step 5: Safe Sequential Session-Based Import
            $importBtn.on('click', function() {
                const validToImport = validatedRows.filter(r => r.is_valid);
                if (validToImport.length === 0) {
                    alert('No valid products found to import. Please fix the CSV errors or mapping.');
                    return;
                }

                if (!confirm('You are about to import ' + validToImport.length + ' products into WooCommerce. Continue?')) {
                    return;
                }

                $previewCard.hide();
                $progressCard.show();
                $progressBar.css('width', '5%');
                $('#modena-results-wrap').hide();

                const dupAction = $('input[name="duplicate_action"]:checked').val() || 'update';
                runSafeSessionImport(validToImport, dupAction);
            });

            async function runSafeSessionImport(items, dupAction) {
                const total = items.length;
                let created = 0;
                let updated = 0;
                let skipped = 0;
                let failed = 0;
                const chunkSize = 2; // 2 products per AJAX request for zero memory spikes

                for (let i = 0; i < total; i += chunkSize) {
                    const chunk = items.slice(i, i + chunkSize);
                    const chunkRowNumbers = chunk.map(c => c.row_number);
                    const percent = Math.round((i / total) * 100);
                    $progressBar.css('width', Math.max(5, percent) + '%');
                    $('#modena-progress-status').html(
                        'Importing product <strong>' + (i + 1) + ' - ' + Math.min(i + chunkSize, total) + ' of ' + total + '</strong> (' + percent + '%)...'
                    );

                    try {
                        const res = await $.ajax({
                            url: ajaxurl,
                            type: 'POST',
                            data: {
                                action: 'modena_process_import_batch',
                                security: nonce,
                                session_id: currentSessionId,
                                row_numbers: JSON.stringify(chunkRowNumbers),
                                duplicate_action: dupAction
                            }
                        });

                        if (res.success) {
                            created += (res.data.created || 0);
                            updated += (res.data.updated || 0);
                            skipped += (res.data.skipped || 0);
                            failed  += (res.data.failed || 0);
                        } else {
                            failed += chunk.length;
                        }
                    } catch (err) {
                        console.error('Batch error:', err);
                        failed += chunk.length;
                    }
                }

                $progressBar.css('width', '100%');
                $('#modena-progress-status').text('Import complete!');
                $('#modena-results-summary').html(
                    'Processed: <strong>' + total + '</strong> products | ' +
                    'Created: <strong style="color:#008a20;">' + created + '</strong> | ' +
                    'Updated: <strong style="color:#856404;">' + updated + '</strong> | ' +
                    'Skipped: <strong style="color:#646970;">' + skipped + '</strong> | ' +
                    (failed > 0 ? 'Failed: <strong style="color:#d63638;">' + failed + '</strong>' : 'Failed: <strong>0</strong>')
                );
                $('#modena-results-wrap').slideDown(200);
            }

            $('#modena-new-import-btn').on('click', function() {
                $fileInput.val('');
                $filename.text('');
                $parseBtn.hide();
                $mappingCard.hide();
                $previewCard.hide();
                $progressCard.hide();
                $('#modena-upload-progress-container').hide();
                validatedRows = [];
            });
        });
        </script>
        <?php
    }
}

Modena_Product_Importer::init();
