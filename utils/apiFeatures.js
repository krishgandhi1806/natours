class APIFeatures{
    constructor(query, queryString)
    {
      this.query= query;
      this.queryString= queryString;
    }
  
    filter()
    {
      const queryObj= {...this.queryString};
      const excludedFields= ['page', 'limit', 'sort', 'fields'];
      excludedFields.forEach(el=>{
        delete queryObj[el];
      })
  
      // console.log(queryObj);
  // Advance Filtering
      let queryStr= JSON.stringify(queryObj);
      queryStr= queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match=> `$${match}`);
      // console.log(JSON.parse(queryStr));
  
      this.query.find(JSON.parse(queryStr));
      return this;
    }
  
    sort(){
      if(this.queryString.sort)
      {
        const sortBy= this.queryString.sort.split(',').join(" ");
        this.query= this.query.sort(sortBy);
      }
      else{
        this.query= this.query.sort('-createdAt');
      }
      return this;
    }
  
    limiting(){
      if(this.queryString.fields)
        {
          const field= this.queryString.fields.split(',').join(' ');
          this.query= this.query.select(field);
        }
        else{
          this.query= this.query.sort('-createdAt');
        }
  
      return this;
    }
  
    paginate()
    {
      const page= this.queryString.page *1 || 1;
        const limit= this.queryString.limit * 1 || 10;
        const skip= (page-1) * limit;
  
        this.query= this.query.skip(skip).limit(limit);
        return this;
    }
  
}

module.exports= APIFeatures;
