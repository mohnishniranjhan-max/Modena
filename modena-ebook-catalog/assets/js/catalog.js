export const renderCatalog = (categorizedProducts) => {
    const container = document.getElementById('catalog-container');
    const tocDynamicList = document.getElementById('toc-dynamic-list');
    
    // Counter for pages (approximate logic for physical print simulation)
    let pageCount = 4; // Cover(1), About(2), TOC(3)
    
    Object.keys(categorizedProducts).forEach((category) => {
        // 1. Create Category Divider Page
        const dividerPage = document.createElement('div');
        dividerPage.className = 'page category-divider-page';
        dividerPage.innerHTML = `
            <div class="category-divider-content">
                <h1>${category}</h1>
                <div class="divider-line"></div>
            </div>
        `;
        container.insertBefore(dividerPage, document.querySelector('.contact-page'));
        
        pageCount++;
        
        // Add to TOC
        const tocItem = document.createElement('li');
        tocItem.innerHTML = `
            <span class="toc-title" style="margin-left: 10px;">${category}</span>
            <span class="toc-dots"></span>
            <span class="toc-page-num">${pageCount}</span>
        `;
        if(tocDynamicList) tocDynamicList.appendChild(tocItem);

        // 2. Render Products for this Category
        const products = categorizedProducts[category];
        const productsPerPage = 4; // Display 4 products per page in a 2x2 grid
        
        for (let i = 0; i < products.length; i += productsPerPage) {
            const pageProducts = products.slice(i, i + productsPerPage);
            
            const productPage = document.createElement('div');
            productPage.className = 'page';
            
            const header = document.createElement('div');
            header.className = 'page-header';
            header.innerHTML = `<h2>${category}</h2><div class="header-line"></div>`;
            productPage.appendChild(header);
            
            const grid = document.createElement('div');
            grid.className = 'product-grid-page';
            
            pageProducts.forEach(product => {
                const card = document.createElement('div');
                card.className = 'product-card';
                
                const specsHtml = product.specs.length > 0 
                    ? `<div class="product-specs"><ul>${product.specs.map(s => `<li>${s}</li>`).join('')}</ul></div>` 
                    : '';

                card.innerHTML = `
                    <div class="product-image-wrapper">
                        <img src="${product.image}" alt="${product.name}" onerror="this.src='https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=800&auto=format&fit=crop';">
                    </div>
                    <div class="product-category-label">${product.category}</div>
                    <div class="product-name">${product.name}</div>
                    <div class="product-price">${product.price}</div>
                    <div class="product-desc">${product.description}</div>
                    ${specsHtml}
                `;
                grid.appendChild(card);
            });
            
            productPage.appendChild(grid);
            container.insertBefore(productPage, document.querySelector('.contact-page'));
            
            pageCount++;
        }
    });

    // Update Contact Page TOC number
    const contactNum = document.querySelector('[data-ref="contact-page"]');
    if(contactNum) contactNum.textContent = pageCount + 1;
};
