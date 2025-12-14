import { Injectable } from "@angular/core";
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
} from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";

@Injectable({ providedIn: "root" })
export class ApiInterceptor implements HttpInterceptor {
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Use environment API URL or fallback to localhost
    const apiUrl = environment.apiUrl || 'http://localhost:8000/api';
    const apiReq = req.clone({ url: `${apiUrl}${req.url}` });
    return next.handle(apiReq);
  }
}
