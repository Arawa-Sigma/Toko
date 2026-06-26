export const makeSlug = (name, id) => {
    if (!name) return String(id);
    const cleanName = name.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    return `${cleanName}-${id}`
}
