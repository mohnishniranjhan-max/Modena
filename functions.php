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
?>
