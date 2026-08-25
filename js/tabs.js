document.addEventListener("DOMContentLoaded", () => {
    
    const buttons = document.querySelectorAll(".tab-button");
    const folders = document.querySelectorAll(".tab-content-folder");

    buttons.forEach(button => {
        button.addEventListener("click", () => {
            
            const targetTab = button.getAttribute("data-tab");
          
            buttons.forEach(btn => btn.classList.remove("active"));
            
            button.classList.add("active");

            folders.forEach(folder => folder.classList.remove("active-folder"));
            
            const targetFolder = document.getElementById(`${targetTab}-list`);
            if (targetFolder) {
                targetFolder.classList.add("active-folder");
            }
        });
    });
});