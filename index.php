<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
    
    <!-- This is where your React app will mount -->
    <div id="root"></div>
    
    <?php wp_footer(); ?>
</body>
</html>
