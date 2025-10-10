gh release list --limit 500 \
  | cut -f3 \
  | while read release_tag; do
  gh release delete --cleanup-tag -y "$release_tag"
done