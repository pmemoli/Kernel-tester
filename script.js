let imageUrl = ''

// File input functionality
document.getElementById('image-input').addEventListener('change', handleFileSelect)

// Button functionality
const applyButton = document.getElementById('apply-button')
applyButton.addEventListener('click', applyKernel)

function handleFileSelect(e) {
    const reader = new FileReader()
    const file = e.target.files[0]
    reader.readAsDataURL(file)

    reader.addEventListener('load', () => {
        imageUrl = reader.result
    })
}

function applyKernel() {
    const kernel = getTableValues()
    draw(imageUrl, kernel)
}

function getTableValues() {
    const values = []
    const table = document.getElementById('table')

    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            values.push(table.rows[i].getElementsByTagName('input')[j].value)
        }
    }

    return values
}
